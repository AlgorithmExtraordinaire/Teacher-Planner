#!/usr/bin/env bash
# Fire the workflow scheduler. Invoked by teacher-planner-scheduler.service.
#
# The secret is read out of .env here rather than through systemd's
# EnvironmentFile: .env holds values with '#' and '=' inside them that
# systemd's parser mangles, and keeping it out of the unit keeps it out of
# `systemctl cat` and journal metadata.
set -euo pipefail

cd /opt/teacher-planner

SECRET="$(grep -E '^CRON_SECRET=' .env | head -1 | cut -d= -f2-)"
if [ -z "${SECRET}" ]; then
  echo "CRON_SECRET is not set in /opt/teacher-planner/.env" >&2
  exit 78   # EX_CONFIG - a misconfiguration, not a workflow failure
fi

BODY="$(mktemp)"
trap 'rm -f "${BODY}"' EXIT

CODE="$(curl -sS --max-time 300 -o "${BODY}" -w '%{http_code}' \
  -X POST \
  -H "Authorization: Bearer ${SECRET}" \
  http://127.0.0.1:8200/api/cron/workflows)"

cat "${BODY}"
echo

# The endpoint answers 500 when any individual workflow failed, so a
# non-200 must fail the unit - otherwise `systemctl status` would show
# success while alerts silently stopped being generated.
if [ "${CODE}" != "200" ]; then
  echo "scheduler returned HTTP ${CODE}" >&2
  exit 1
fi
