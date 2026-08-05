#!/usr/bin/env python3
"""
Sync the school curriculum Google Drive into resource_collections + resources.

    cd /opt/teacher-planner
    SUPA_URL=... SUPA_KEY=... GOOGLE_SERVICE_ACCOUNT_FILE=/etc/teacher-planner/drive-sa.json \
    python3 scripts/drive_sync.py [--dry-run] [--max-depth 6]

Runs unattended on the droplet from a systemd timer. The interactive Drive
connector could map the folder tree but not the several thousand files under
it; that is what this replaces.

AUTHENTICATION
--------------
Service account, two-legged JWT bearer flow, signed locally with
`cryptography` and exchanged for an access token. google-auth would do the
same thing behind a dependency tree; the flow is thirty lines, so it is
written out rather than pulled in.

Scope is drive.readonly and nothing else. The job never creates, modifies or
deletes anything in Drive.

WHAT IT DOES NOT DO
-------------------
It does not delete rows for files that vanished from Drive. A file missing
from one crawl is far more often a permission blip or a paging error than a
real deletion, and silently dropping curriculum records on that basis is not
recoverable. Instead every row carries last_synced_at, and the run reports
how many rows it did not touch. Pruning stays a human decision.
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

# Stamped on every row this run touches, so "not touched by the latest run"
# is a single comparison. Sent as an ISO literal rather than the string
# "now()", which is not a valid timestamptz value.
RUN_AT = datetime.now(timezone.utc).isoformat()

SCOPE = "https://www.googleapis.com/auth/drive.readonly"
FOLDER_MIME = "application/vnd.google-apps.folder"
PAGE_FIELDS = (
    "nextPageToken,files(id,name,mimeType,size,parents,webViewLink,modifiedTime)"
)

SUPA_URL = os.environ["SUPA_URL"].rstrip("/")
SUPA_KEY = os.environ["SUPA_KEY"]
SUPA_HEADERS = {
    "apikey": SUPA_KEY,
    "Authorization": f"Bearer {SUPA_KEY}",
    "Content-Type": "application/json",
}


# --------------------------------------------------------------------------
# HTTP with retry. Drive returns 403 rateLimitExceeded and 429 under load and
# both are expected, not exceptional — a nightly crawl of a few thousand files
# will hit them. Anything still failing after five attempts is a real fault.
# --------------------------------------------------------------------------
def http(url, *, data=None, headers=None, method=None, timeout=90, retries=5):
    for attempt in range(retries):
        req = urllib.request.Request(
            url, data=data, headers=headers or {}, method=method
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read()
                return json.loads(body) if body else None
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:400]
            retriable = e.code in (403, 429, 500, 502, 503, 504)
            if not retriable or attempt == retries - 1:
                raise RuntimeError(f"HTTP {e.code} {url}\n{detail}") from None
            time.sleep(2 ** attempt)
        except urllib.error.URLError:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)


def b64u(raw: bytes) -> bytes:
    return base64.urlsafe_b64encode(raw).rstrip(b"=")


def access_token(sa: dict) -> str:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding

    now = int(time.time())
    claims = {
        "iss": sa["client_email"],
        "scope": SCOPE,
        "aud": sa["token_uri"],
        "iat": now,
        "exp": now + 3600,
    }
    # Only set when the workspace admin has granted domain-wide delegation and
    # the Drive is shared with a person rather than the service account.
    subject = os.environ.get("GOOGLE_IMPERSONATE_SUBJECT")
    if subject:
        claims["sub"] = subject

    header = {"alg": "RS256", "typ": "JWT"}
    signing_input = b".".join(
        b64u(json.dumps(part, separators=(",", ":")).encode())
        for part in (header, claims)
    )
    key = serialization.load_pem_private_key(
        sa["private_key"].encode(), password=None
    )
    signature = key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    assertion = signing_input + b"." + b64u(signature)

    payload = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": assertion.decode(),
    }).encode()
    token = http(
        sa["token_uri"], data=payload, method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return token["access_token"]


def list_children(token: str, folder_id: str):
    """Every non-trashed child of one folder, following pagination."""
    out, page = [], None
    while True:
        params = {
            "q": f"'{folder_id}' in parents and trashed = false",
            "fields": PAGE_FIELDS,
            "pageSize": "1000",
            "supportsAllDrives": "true",
            "includeItemsFromAllDrives": "true",
            "corpora": "allDrives",
            "orderBy": "folder,name",
        }
        if page:
            params["pageToken"] = page
        url = "https://www.googleapis.com/drive/v3/files?" + urllib.parse.urlencode(params)
        data = http(url, headers={"Authorization": f"Bearer {token}"})
        out.extend(data.get("files", []))
        page = data.get("nextPageToken")
        if not page:
            return out


# --------------------------------------------------------------------------
# Supabase
# --------------------------------------------------------------------------
def supa_get(path):
    return http(f"{SUPA_URL}/rest/v1/{path}", headers=SUPA_HEADERS)


def supa_upsert(table, rows, conflict, chunk=200):
    if not rows:
        return 0
    hdr = dict(SUPA_HEADERS)
    hdr["Prefer"] = "resolution=merge-duplicates,return=minimal"
    for i in range(0, len(rows), chunk):
        q = urllib.parse.urlencode({"on_conflict": conflict})
        http(
            f"{SUPA_URL}/rest/v1/{table}?{q}",
            data=json.dumps(rows[i:i + chunk]).encode(),
            headers=hdr, method="POST",
        )
    return len(rows)


# --------------------------------------------------------------------------
# Classification. Inherited down the tree: a file three levels under
# "Mathematics/Grade 4/Module 2" is Grade 4 Mathematics even though its own
# name says neither.
# --------------------------------------------------------------------------
GRADE_WORDS = {
    "pre-k": "Pre-K", "prek": "Pre-K", "pre k": "Pre-K",
    "kindergarten": "Kindergarten", "kinder": "Kindergarten",
}


def grade_from(name: str):
    low = name.lower()
    for word, grade in GRADE_WORDS.items():
        if word in low:
            return grade
    for n in range(12, 0, -1):          # 12 before 1, so "Grade 12" wins
        if f"grade {n}" in low or low.strip() in (f"g{n}", f"gr{n}"):
            return f"Grade {n}"
    return None


def subject_from(name: str):
    low = name.lower()
    if "math" in low or "eureka" in low:
        return "Mathematics"
    if "english language arts" in low or "ela" in low or "wit & wisdom" in low:
        return "English Language Arts"
    if "science" in low or "seed" in low:
        return "Science"
    if "social studies" in low or "history" in low:
        return "Social Studies"
    return None


def doc_role_from(name: str):
    low = name.lower()
    if "teacher" in low:
        return "teacher_edition"
    if "student" in low or "workbook" in low or "learn" in low:
        return "student_workbook"
    if "additional" in low or "materials" in low or "supplement" in low:
        return "additional_materials"
    if "full module" in low or "complete" in low:
        return "full_module"
    if "outline" in low or "overview" in low or "scope" in low or "pacing" in low:
        return "curriculum_outline"
    return "other"


def kind_from(mime: str):
    if mime == "application/pdf":
        return "pdf"
    if mime.startswith("video/"):
        return "video"
    if mime.startswith("audio/"):
        return "audio"
    if mime.startswith("application/vnd.google-apps."):
        return "page"
    return "file"


# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--max-depth", type=int, default=6)
    args = ap.parse_args()

    sa_file = os.environ["GOOGLE_SERVICE_ACCOUNT_FILE"]
    with open(sa_file, encoding="utf-8") as fh:
        sa = json.load(fh)
    token = access_token(sa)
    print(f"authenticated as {sa['client_email']}")

    # Roots: whatever is already recorded at depth 0, or an explicit override.
    env_roots = os.environ.get("DRIVE_ROOT_FOLDER_IDS", "").strip()
    if env_roots:
        roots = [r.strip() for r in env_roots.split(",") if r.strip()]
        known = {}
    else:
        rows = supa_get(
            "resource_collections?select=id,drive_folder_id,name,subject,"
            "grade_level,path,depth&depth=eq.0"
        )
        roots = [r["drive_folder_id"] for r in rows if r["drive_folder_id"]]
        known = {r["drive_folder_id"]: r for r in rows}
    if not roots:
        sys.exit("no root folders: set DRIVE_ROOT_FOLDER_IDS or seed depth-0 rows")

    existing = {
        r["drive_folder_id"]: r
        for r in supa_get(
            "resource_collections?select=id,drive_folder_id,name,subject,grade_level,path"
        ) if r["drive_folder_id"]
    }
    known.update(existing)

    run_id = None
    if not args.dry_run:
        hdr = dict(SUPA_HEADERS)
        hdr["Prefer"] = "return=representation"
        run = http(
            f"{SUPA_URL}/rest/v1/resource_sync_runs",
            data=json.dumps({"status": "running"}).encode(),
            headers=hdr, method="POST",
        )
        run_id = run[0]["id"]

    folders_seen = files_seen = 0
    try:
        # Breadth-first, one level at a time. Depth-first would need parent
        # UUIDs before they exist; going level by level means a child's parent
        # row is always already written.
        frontier = [(fid, 0) for fid in roots]
        while frontier:
            next_frontier = []
            for folder_id, depth in frontier:
                if depth >= args.max_depth:
                    continue
                parent = known.get(folder_id, {})
                children = list_children(token, folder_id)

                sub_rows, file_rows = [], []
                for i, child in enumerate(children):
                    inherited_subject = (
                        subject_from(child["name"]) or parent.get("subject")
                    )
                    inherited_grade = (
                        grade_from(child["name"]) or parent.get("grade_level")
                    )
                    path = f"{parent.get('path') or parent.get('name') or ''}/{child['name']}".lstrip("/")

                    if child["mimeType"] == FOLDER_MIME:
                        sub_rows.append({
                            "source": "drive",
                            "drive_folder_id": child["id"],
                            "parent_id": parent.get("id"),
                            "name": child["name"],
                            "subject": inherited_subject,
                            "grade_level": inherited_grade,
                            "module_name": child["name"],
                            "depth": depth + 1,
                            "path": path,
                            "view_url": child.get("webViewLink"),
                            "last_synced_at": RUN_AT,
                        })
                        next_frontier.append((child["id"], depth + 1))
                    elif parent.get("id"):
                        # resources_one_parent forbids a row with neither a
                        # course nor a collection, so a file directly under an
                        # unrecorded folder is skipped rather than orphaned.
                        file_rows.append({
                            "source": "drive",
                            "drive_file_id": child["id"],
                            "collection_id": parent["id"],
                            "name": child["name"],
                            "kind": kind_from(child["mimeType"]),
                            "mime_type": child["mimeType"],
                            "file_url": child.get("webViewLink"),
                            "file_size": int(child["size"]) if child.get("size") else None,
                            "section_name": parent.get("path"),
                            "sort_order": i,
                            "ai_subject": inherited_subject,
                            "doc_role": doc_role_from(child["name"]),
                            "last_synced_at": RUN_AT,
                        })

                if args.dry_run:
                    folders_seen += len(sub_rows)
                    files_seen += len(file_rows)
                    continue

                if sub_rows:
                    supa_upsert("resource_collections", sub_rows, "drive_folder_id")
                    folders_seen += len(sub_rows)
                    # Re-read to pick up UUIDs for the rows just written, so
                    # the next level can point its parent_id at them.
                    ids = ",".join(r["drive_folder_id"] for r in sub_rows)
                    for row in supa_get(
                        "resource_collections?select=id,drive_folder_id,subject,"
                        f"grade_level,path,name&drive_folder_id=in.({ids})"
                    ):
                        known[row["drive_folder_id"]] = row
                if file_rows:
                    supa_upsert("resources", file_rows, "drive_file_id")
                    files_seen += len(file_rows)

            frontier = next_frontier
            print(f"  depth done — {folders_seen} folders, {files_seen} files")

        status, error = "success", None
    except Exception as exc:                       # noqa: BLE001 - recorded, then re-raised
        status, error = "failed", f"{type(exc).__name__}: {exc}"[:2000]
        raise
    finally:
        if run_id:
            hdr = dict(SUPA_HEADERS)
            hdr["Prefer"] = "return=minimal"
            http(
                f"{SUPA_URL}/rest/v1/resource_sync_runs?id=eq.{run_id}",
                data=json.dumps({
                    "status": status, "finished_at": datetime.now(timezone.utc).isoformat(),
                    "categories_seen": folders_seen,
                    "resources_seen": files_seen,
                    "error_message": error,
                }).encode(),
                headers=hdr, method="PATCH",
            )

    print(f"folders: {folders_seen}")
    print(f"files:   {files_seen}")

    if not args.dry_run:
        hdr = dict(SUPA_HEADERS)
        hdr["Prefer"] = "count=exact"
        hdr["Range"] = "0-0"
        stale = http(
            f"{SUPA_URL}/rest/v1/resources?select=id&source=eq.drive"
            f"&or=(last_synced_at.is.null,last_synced_at.lt.{RUN_AT})",
            headers=hdr,
        )
        if stale:
            print(f"note: {len(stale)}+ drive rows were not touched by this run "
                  f"— inspect resources.last_synced_at before pruning anything")


if __name__ == "__main__":
    main()
