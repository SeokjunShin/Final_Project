#!/usr/bin/env bash
set -euo pipefail

# VM3 log pull script (Option B: rsync pull)
# Usage:
#   WEB_HOST=10.0.0.11 WAS_HOST=10.0.0.12 ./scripts/logging/vm3_pull_logs.sh

WEB_HOST="${WEB_HOST:-}"
WAS_HOST="${WAS_HOST:-}"
LOG_ROOT="${LOG_ROOT:-/var/log/mycard/central}"
SSH_USER="${SSH_USER:-mycard}"

if [[ -z "$WEB_HOST" || -z "$WAS_HOST" ]]; then
  echo "WEB_HOST and WAS_HOST are required"
  exit 1
fi

mkdir -p "$LOG_ROOT/web" "$LOG_ROOT/was"

# WEB logs
rsync -az --delete "${SSH_USER}@${WEB_HOST}:/var/log/nginx/" "$LOG_ROOT/web/nginx/"
rsync -az --delete "${SSH_USER}@${WEB_HOST}:/var/log/mycard/" "$LOG_ROOT/web/mycard/" || true

# WAS logs
rsync -az --delete "${SSH_USER}@${WAS_HOST}:/var/log/mycard/" "$LOG_ROOT/was/mycard/"

echo "Collected logs to $LOG_ROOT"
