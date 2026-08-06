# Notion integration for `scripts/update_kb.mjs`

The script needs an **internal integration token**. The Notion connector used
during interactive Claude Code sessions is a different credential (OAuth, tied
to a signed-in person) and will not work for an unattended script — which is
the whole point of having the script.

**This requires your Notion account.** It cannot be done from the codebase.

---

## Steps

### 1. Create the integration

<https://www.notion.so/profile/integrations> → **New integration**.

- Name: `Teacher Planner KB Writer`
- Associated workspace: the SCA workspace
- Type: **Internal**

Under **Capabilities**, tick **Read content** and **Insert content**.
Leave **Update content** and **Delete content** unticked — the script only
appends, and a credential that cannot overwrite is the cheapest possible
enforcement of the non-destructive policy in `CLAUDE.md`.

Copy the **Internal Integration Secret** (starts `ntn_`). Treat it as a
password: it is not needed anywhere but the `.env` below, and it should not be
pasted into a chat window, including to me.

### 2. Share the target page with the integration

The integration starts with access to nothing. Open the KB page you want the
manual appended to → **⋯** menu → **Connections** → **Connect to** → pick
`Teacher Planner KB Writer`.

Access is inherited by child pages, so connecting at the hub level covers the
pages beneath it.

### 3. Get the page ID

From the page URL. In
`https://www.notion.so/Some-Page-3ae208e4e3bf81d49d93f0758cde7e66`
the ID is the 32-character hex string at the end — `3ae208e4e3bf81d49d93f0758cde7e66`.
Dashes are optional.

### 4. Put both in `.env`

In the repository root (`.env` is gitignored — confirm before writing):

```
NOTION_API_KEY=ntn_your_internal_integration_secret
NOTION_PAGE_ID=3ae208e4e3bf81d49d93f0758cde7e66
```

### 5. Dry run first

```bash
npm run kb:update -- --dry-run
```

This authenticates, reads the page, and writes nothing. It should report the
existing block count. Then:

```bash
npm run kb:update
```

---

## Behaviour worth knowing

**It will not append twice.** The script looks for its own marker heading and
stops if the manual is already on the page. Use `--force` to append a fresh
dated revision alongside the old one — which is the correct way to record a
change, since the policy forbids editing the previous version.

**It never modifies or deletes.** There is no code path that does. The manual
is appended after a divider.

**Exit codes:** `78` means configuration is missing (token or page ID absent);
`1` means the run genuinely failed. They are kept distinct so a scheduled run
that was never configured does not look like a broken one.

## If it fails

| Message | Cause |
|---|---|
| `NOTION_API_KEY and NOTION_PAGE_ID are required` | step 4 not done |
| `API token is invalid` | secret mistyped or truncated |
| `Could not find block with ID` | step 2 not done — the page is not shared with the integration |
| `object_not_found` | the page ID is wrong, or it belongs to another workspace |
