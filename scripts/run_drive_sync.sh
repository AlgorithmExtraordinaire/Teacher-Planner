#!/usr/bin/env bash
# Nightly curriculum Drive crawl. Invoked by teacher-planner-drive-sync.service.
set -euo pipefail

cd /opt/teacher-planner

SUPA_URL="$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env | head -1 | cut -d= -f2-)"
SUPA_KEY="$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' .env | head -1 | cut -d= -f2-)"
GOOGLE_SERVICE_ACCOUNT_FILE="${GOOGLE_SERVICE_ACCOUNT_FILE:-/etc/teacher-planner/drive-sa.json}"
export SUPA_URL SUPA_KEY GOOGLE_SERVICE_ACCOUNT_FILE

if [ -z "${SUPA_URL}" ] || [ -z "${SUPA_KEY}" ]; then
  echo "Supabase URL or service-role key missing from /opt/teacher-planner/.env" >&2
  exit 78
fi

# Exit 78 (EX_CONFIG) distinguishes "the key was never installed" from "the
# crawl broke", so a missing service account does not read as a Drive fault.
if [ ! -r "${GOOGLE_SERVICE_ACCOUNT_FILE}" ]; then
  echo "service-account key not readable at ${GOOGLE_SERVICE_ACCOUNT_FILE}" >&2
  echo "see deploy/GOOGLE_DRIVE_SERVICE_ACCOUNT.md" >&2
  exit 78
fi

exec python3 scripts/drive_sync.py "$@"
