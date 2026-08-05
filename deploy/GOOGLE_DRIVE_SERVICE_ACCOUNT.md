# Google Drive service account

The nightly Drive sync needs its own identity. It cannot borrow yours: an
OAuth "sign in with Google" token expires and needs a human at a browser, and
an unattended job at 02:00 has no human. A service account is a non-human
Google identity with its own key that never expires and never prompts.

**This part cannot be done from the Teacher Planner codebase.** Creating a
service account requires signing in to the Google Cloud console as the school,
which only you can do. Everything after step 5 is already written and waiting.

---

## What you are creating

| | |
|---|---|
| A Google Cloud **project** | a container; free, no billing needed for this |
| A **service account** inside it | an identity like `teacher-planner-drive@….iam.gserviceaccount.com` |
| A **JSON key** for that account | the credential the droplet uses |
| A **share** of the curriculum Drive to that address | read-only |

The service account sees exactly what you share with it and nothing else. It
is not an administrator of your Workspace.

---

## Steps

### 1. Create or pick a Google Cloud project

Go to <https://console.cloud.google.com/projectcreate>, sign in as the school
account. Name it `sca-teacher-planner`. Create.

If the school already has a Cloud project, you may reuse it — nothing here
conflicts with existing use.

### 2. Enable the Drive API

<https://console.cloud.google.com/apis/library/drive.googleapis.com> →
make sure the project selector at the top shows `sca-teacher-planner` →
**Enable**.

Without this the key authenticates fine and every listing returns 403. If the
sync later fails with `accessNotConfigured`, this step was missed.

### 3. Create the service account

<https://console.cloud.google.com/iam-admin/serviceaccounts> → **Create
service account**.

- Name: `teacher-planner-drive`
- Description: `Read-only nightly curriculum Drive sync`
- **Skip** the "Grant this service account access to the project" step — it
  needs no project role. Its access comes from the Drive share in step 5.
- Click **Done**.

Copy the email address it was given. It looks like
`teacher-planner-drive@sca-teacher-planner.iam.gserviceaccount.com`.

### 4. Create a JSON key

Click the new account → **Keys** tab → **Add key** → **Create new key** →
**JSON** → **Create**.

A `.json` file downloads. **This file is a password.** Anyone holding it can
read every file shared with the account. Do not email it, do not put it in
the repo, do not paste it into a chat window — including this one. Step 6
moves it to the server; delete your local copy afterwards.

### 5. Share the curriculum Drive with it

Open the school curriculum folder in Drive → **Share** → paste the service
account's email address → set the role to **Viewer** → untick "Notify people"
(there is no inbox behind that address) → **Share**.

Viewer, not Editor. The job only ever reads, and a read-only share means a
mistake in the code cannot damage the curriculum.

Share the *top-level* folder — sharing propagates down, so every module folder
underneath is covered by this one action.

### 6. Install the key on the droplet

From the machine where the JSON downloaded:

```bash
scp -i ~/.ssh/teacher_planner_do_droplet ~/Downloads/sca-teacher-planner-*.json root@147.182.222.188:/etc/teacher-planner/drive-sa.json
```

Then on the droplet, lock it down and delete your local copy:

```bash
mkdir -p /etc/teacher-planner && chmod 700 /etc/teacher-planner && chmod 600 /etc/teacher-planner/drive-sa.json
```

### 7. Prove it works before trusting the timer

```bash
cd /opt/teacher-planner && ./scripts/run_drive_sync.sh --dry-run --max-depth 2
```

A dry run reads Drive and writes nothing. It should print
`authenticated as teacher-planner-drive@…` followed by folder and file counts.
Then run it for real:

```bash
systemctl start teacher-planner-drive-sync.service && journalctl -u teacher-planner-drive-sync -n 40 --no-pager
```

---

## If it fails

| Message | Cause |
|---|---|
| `service-account key not readable` | step 6 not done, or wrong path |
| HTTP 403 `accessNotConfigured` | step 2 not done — Drive API not enabled |
| HTTP 401 `invalid_grant` | key JSON truncated, or the droplet clock is wrong (`timedatectl`) |
| `no root folders` | no depth-0 rows and no `DRIVE_ROOT_FOLDER_IDS` set |
| Authenticates, finds 0 files | step 5 not done, or shared with the wrong address |

## Rotating the key

Create a second key in the console, install it as in step 6, confirm one run
succeeds, then delete the old key from the **Keys** tab. Deleting first means
a failed night before anyone notices.
