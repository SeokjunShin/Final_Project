#!/usr/bin/env bash
set -euo pipefail

# Evidence export for manual assessment
# Usage:
#   CASE_ID=CASE-001 FROM=2026-03-01 TO=2026-03-31 DB_USER=mycard_app DB_PASS=*** ./scripts/evidence/export_evidence.sh

CASE_ID="${CASE_ID:-case-unknown}"
FROM="${FROM:-$(date +%F)}"
TO="${TO:-$(date +%F)}"
OUT_DIR="${OUT_DIR:-./evidence_out/${CASE_ID}}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-mycard}"
DB_USER="${DB_USER:-}"
DB_PASS="${DB_PASS:-}"

mkdir -p "$OUT_DIR/logs" "$OUT_DIR/db"

# collect local logs
cp -r /var/log/mycard "$OUT_DIR/logs/mycard" 2>/dev/null || true
cp -r /var/log/nginx "$OUT_DIR/logs/nginx" 2>/dev/null || true

if [[ -n "$DB_USER" && -n "$DB_PASS" ]]; then
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e \
    "SELECT id,email,IF(success=1,'SUCCESS','FAIL') AS success,ip,user_agent,created_at FROM login_attempts WHERE created_at BETWEEN '${FROM} 00:00:00' AND '${TO} 23:59:59'" \
    > "$OUT_DIR/db/login_attempts.csv"

  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e \
    "SELECT id,actor_id,actor_role,action,target_type,target_id,request_id,ip,created_at FROM audit_logs WHERE created_at BETWEEN '${FROM} 00:00:00' AND '${TO} 23:59:59'" \
    > "$OUT_DIR/db/audit_logs.csv"

  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e \
    "SELECT id,user_id,category,title,status,created_at FROM inquiries WHERE created_at BETWEEN '${FROM} 00:00:00' AND '${TO} 23:59:59'" \
    > "$OUT_DIR/db/inquiries.csv"
fi

ARCHIVE="${OUT_DIR}.tar.gz"
tar -czf "$ARCHIVE" -C "$(dirname "$OUT_DIR")" "$(basename "$OUT_DIR")"

echo "Evidence exported: $ARCHIVE"
