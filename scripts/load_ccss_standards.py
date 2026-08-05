#!/usr/bin/env python3
"""
Load CCSS Mathematics and English Language Arts standards, K-8, into
public.curriculum_standards.

Run from the droplet so the service-role key never leaves it:

    cd /opt/teacher-planner
    SUPA_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env | cut -d= -f2-) \
    SUPA_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2-) \
    python3 scripts/load_ccss_standards.py

Idempotent: upserts on (framework, code), which migration 0015 makes unique.
Re-running merges rather than duplicating.

SOURCE AND VERIFICATION
-----------------------
The canonical CSV published at corestandards.org/assets/E0607_ccss_identifiers.csv
currently 404s, so this uses a mirrored copy of the same dataset. Because the
mirror is third-party it was verified before first use:

  * Six well-known standards were checked against their canonical text:
    K.CC.A.1, 3.OA.A.1, 8.EE.A.1, RL.3.1, RF.1.2, W.5.1 — all exact.
  * Every K-8 maths code was cross-checked against the Oregon Department of
    Education's official CCSS spreadsheet. They agree once punctuation is
    normalised; the only differences are Oregon's own formatting
    ("1.NBT.2 a." vs "1.NBT.2.a") and a typo in Oregon's sheet ("1.NBT4").

Known defect in the source, handled below: seven descriptions contain a stray
underscore. Six are legitimate — CCSS genuinely writes "5 = _ - 3" to denote a
blank. One, 3.OA.A.1, lost a multiplication sign, and is repaired here rather
than by hand so the correction survives a reload.
"""

import csv
import io
import json
import os
import urllib.request

CSV_URL = (
    "https://gist.githubusercontent.com/philngo/2735248c98c3e0cd7814/raw/"
    "68bd2fe0d73b6ba4e14cf9eabc129efd61f4fdc8/ccss.csv"
)

K8 = set("K12345678")
BAND = {
    "K": "Kindergarten",
    "1": "Elementary (1-5)", "2": "Elementary (1-5)", "3": "Elementary (1-5)",
    "4": "Elementary (1-5)", "5": "Elementary (1-5)",
    "6": "Middle School (6-8)", "7": "Middle School (6-8)", "8": "Middle School (6-8)",
}


def build_rows(text):
    rows, skipped = [], 0
    for r in csv.DictReader(io.StringIO(text)):
        grade = r["grade_id"]
        if grade in K8:
            band, level = BAND[grade], r["grade_name"]
        elif grade == "6-8":
            band, level = "Middle School (6-8)", "Grades 6-8"
        elif grade == "":
            band, level = "All bands", "Anchor standard"
        else:
            # 9-12 and the high-school conceptual categories. SCA teaches K-8;
            # loading these would pad the library with standards nobody here
            # teaches.
            skipped += 1
            continue

        if r["content_type"] == "MATH.CONTENT":
            framework, subject = "CCSS-M", "Mathematics"
            code = r["id"].replace("CCSS.MATH.CONTENT.", "")
        else:
            framework, subject = "CCSS-ELA", "English Language Arts"
            code = r["id"].replace("CCSS.ELA-LITERACY.", "")

        description = r["description"]
        if code == "3.OA.A.1":
            description = description.replace("5 _ 7", "5 × 7")

        rows.append({
            "code": code,
            "framework": framework,
            "subject": subject,
            "grade_band": band,
            "grade_level": level,
            "domain": r["category_name"],
            "description": description,
            "source_url": "https://www.thecorestandards.org/",
        })
    return rows, skipped


def main():
    url = os.environ["SUPA_URL"].rstrip("/")
    key = os.environ["SUPA_KEY"]

    with urllib.request.urlopen(CSV_URL, timeout=120) as resp:
        text = resp.read().decode("utf-8")

    rows, skipped = build_rows(text)
    print(f"prepared {len(rows)} K-8 standards (skipped {skipped} high-school rows)")

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    endpoint = f"{url}/rest/v1/curriculum_standards?on_conflict=framework,code"

    sent = 0
    for i in range(0, len(rows), 250):
        chunk = rows[i:i + 250]
        req = urllib.request.Request(
            endpoint, data=json.dumps(chunk).encode(), headers=headers, method="POST"
        )
        with urllib.request.urlopen(req, timeout=90) as resp:
            sent += len(chunk)
            print(f"  batch {i // 250 + 1}: HTTP {resp.status} (+{len(chunk)}, total {sent})")

    print("inserted/merged:", sent)


if __name__ == "__main__":
    main()
