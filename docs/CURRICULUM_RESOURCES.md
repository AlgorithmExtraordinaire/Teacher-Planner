# Curriculum Resources & Hanging Folders — Architecture

Covers extraction of the school's Moodle catalogue, the teacher-facing hanging
folder system, and how resource selection feeds lesson planning.

Source of truth: **Moodle** at `online.elearning-swakopca.edu.na`.

---

## 1. What was actually extracted

Moodle's category listing is reachable without authentication; **course and
resource detail is not**. `/course/index.php?categoryid=40` returns
`cannotviewcategory`, so guest browsing is disabled.

What is confirmed:

| Category | Moodle ID | Courses | Mapped grade band |
|---|---:|---:|---|
| Grade 1 | 38 | 11 | Elementary (1-5) |
| Grade 2 | 39 | 11 | Elementary (1-5) |
| Grade 3 | 40 | 11 | Elementary (1-5) |
| Grade 4 | 41 | 11 | Elementary (1-5) |
| Grade 5 | 42 | 13 | Elementary (1-5) |
| Grade 6 | 43 | 13 | Middle School (6-8) |
| Grade 7 | 44 | 11 | Middle School (6-8) |
| High School | 25 | 12 | High School (9-12) |
| SCA Virtual Communication | 13 | 10 | — |

≈103 courses. All nine rows are loaded into `resource_categories`.

**Course names, book titles, and file resources are not yet extracted** — they
require authentication. They are deliberately *not* guessed or placeholder-filled;
the tables stay empty until a real sync populates them.

## 2. The unlock: Moodle Web Services are already enabled

Probing `/webservice/rest/server.php` with a dummy token returns `invalidtoken`,
not `servicenotavailable`. The REST API is live — so the catalogue can be synced
properly via API rather than scraped.

### What to create in Moodle

*Site administration → Server → Web services*

1. Enable web services (already done).
2. Create an **external service**, e.g. `teacher-planner-sync`, and add these
   functions — all read-only:

   | Function | Returns |
   |---|---|
   | `core_course_get_categories` | Category tree, names, parents, course counts |
   | `core_course_get_courses_by_field` | Courses per category (`field=category`) |
   | `core_course_get_contents` | Sections and modules per course — **this is where books, PDFs, URLs, and pages come from** |
   | `core_webservice_get_site_info` | Connectivity check / token validation |

3. Create a dedicated service account (not a person's login) with a role that can
   only *view* courses, and generate a token for it against that service.

Read-only + dedicated account + scoped function list means the token cannot
modify Moodle even if it leaks. Rotate it from the same screen.

### Where the token lives

**In n8n's credential store, as an HTTP Header Auth credential** — not in this
repo, not in the droplet `.env`, and not in chat. n8n already has a
`httpHeaderAuth` credential type in use. The sync workflow references the
credential by ID; the token value stays inside n8n.

## 3. Sync pipeline (n8n)

```
Schedule Trigger  (nightly, 02:00 Africa/Windhoek)
      │
      ▼
Open sync run ─────────────────► resource_sync_runs (status=running)
      │
      ▼
HTTP: core_course_get_categories
      │  upsert on moodle_category_id
      ▼
resource_categories
      │
      ▼
Loop categories → HTTP: core_course_get_courses_by_field(field=category)
      │  upsert on moodle_course_id
      ▼
resource_courses
      │
      ▼
Loop courses → HTTP: core_course_get_contents
      │  flatten sections[].modules[] → one row per module
      │  upsert on moodle_module_id
      ▼
resources
      │
      ▼
Close sync run ────────────────► status=success, counts recorded
```

**Idempotency** is structural: every table has a `moodle_*_id` unique key and the
sync upserts on it. Re-running never duplicates, so a partial failure is safe to
retry — which matters because n8n does not catch up missed schedules.

**Module → `kind` mapping.** Moodle's `modname` maps onto our `kind` check
constraint: `book`→`book`, `resource`→`pdf`/`file` (by `mimetype`), `url`→`url`,
`page`→`page`, `folder`→`folder`, `quiz`→`quiz`, `assign`→`assignment`,
`scorm`→`scorm`, anything else →`other`.

**Overlap guard.** A nightly schedule against ~103 courses is well inside the
interval, but the open `resource_sync_runs` row doubles as a lock: skip if a run
is already `running` and younger than an hour.

## 4. AI classification pass

Moodle gives structure, not pedagogy. A second pass enriches each resource:

- `ai_subject` — normalised subject, so "Maths G3 Term 2" and "Grade 3
  Mathematics" land in the same bucket
- `ai_topics[]` — topic tags for search and folder suggestions
- `ai_summary` — one line a teacher can scan

Runs only on rows where `ai_classified_at is null` or `last_synced_at` is newer,
so it is incremental and cheap. Gemini is already available in n8n
(`googlePalmApi` credential) and in the app.

## 5. Hanging folders

Schema is applied (migration `0005`). Three tables:

- **`planner_folders`** — self-referencing `parent_id` for nesting, owned by
  `teacher_id`, with `is_ai_generated` marking AI-proposed folders
- **`planner_folder_items`** — folder ↔ resource, `unique(folder_id, resource_id)`
  so the same resource can't be filed twice in one folder
- **`lesson_plan_resources`** — attaches a resource to a lesson plan *by teaching
  role* (`warm_up`, `direct_instruction`, `guided_practice`, `assessment`, …)

RLS: catalogue is readable by all staff and writable by admins; folders are
private to the owning teacher (admins can audit). Lesson-plan attachments inherit
the lesson plan's existing ownership rule.

### Why "by role" matters

Attaching by role is what makes the automation useful rather than decorative:
the Lesson Plan Generator can pre-fill each section with the resources already
filed against that role, instead of the teacher re-finding the same PDF.

### UI shape

```
/resources                     Catalogue browser
  ├── grade rail (9 categories from resource_categories)
  ├── subject + kind filters (ai_subject, kind)
  ├── search over name / ai_topics / ai_summary
  └── multi-select → "Add to folder…"

/resources/folders             Hanging folders
  ├── left: folder tree (drag to nest, drag resources in)
  ├── right: contents of selected folder
  └── "Suggest folders" → AI proposes a structure from the teacher's
       classes, then the teacher accepts or edits before anything is written

/lesson-plans/new              Generator, resource-aware
  └── each section offers resources from the teacher's folders,
       filtered to the class's grade and subject
```

**The AI proposes; the teacher disposes.** Consistent with the agent's existing
approval model — suggested folders are marked `is_ai_generated` and are visible
as suggestions until accepted, so nothing reorganises a teacher's workspace
without consent.

## 6. Implementation order

| # | Step | Status |
|---|---|---|
| 1 | Resource + folder schema, RLS | ✅ Applied (`0005`) |
| 2 | Seed the 9 real Moodle categories | ✅ Done |
| 3 | Moodle service account + scoped token | ⛔ **Needs you** — see §2 |
| 4 | n8n sync workflow (categories → courses → resources) | Ready to build once (3) exists |
| 5 | `/resources` catalogue browser | To build |
| 6 | `/resources/folders` hanging folders + drag-drop | To build |
| 7 | AI classification pass | To build |
| 8 | Generator pre-fills from folders by role | To build |

Steps 5–8 can be built against the empty tables and will populate the moment the
sync runs; they do not need to wait on the token.

## 7. Open risk

The catalogue mirrors Moodle rather than owning it. If a teacher deletes a course
in Moodle, the next sync leaves an orphaned `resources` row pointing at a dead
`file_url`. Options: soft-delete on missing-from-sync, or a `last_seen_at` sweep
that flags stale rows. Not yet decided — worth choosing before the first real
sync, because retrofitting it after teachers have filed resources into folders is
harder.
