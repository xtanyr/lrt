#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=${APP_DIR:-/opt/lrt/current}
ENV_FILE=${ENV_FILE:-/opt/lrt/shared/.env}
dump=${1:?Usage: RESTORE_LRT_CONFIRM=YES restore.sh /path/to/lrt.dump}
if [[ ${RESTORE_LRT_CONFIRM:-} != YES ]]; then
  echo "Restore replaces the active UAT database. Set RESTORE_LRT_CONFIRM=YES after stopping api/web and preserving any needed backup." >&2
  exit 1
fi
[[ -f $dump && -f "$dump.sha256" ]] || { echo "Dump or checksum file not found: $dump" >&2; exit 1; }
(cd "$(dirname "$dump")" && sha256sum -c "$(basename "$dump").sha256")
compose=(docker compose --project-name lrt --env-file "$ENV_FILE" --file "$APP_DIR/compose.yaml")
"${compose[@]}" exec -T db sh -ec 'dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
"${compose[@]}" exec -T db sh -ec 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' < "$dump"
echo "Database restored from $dump"
