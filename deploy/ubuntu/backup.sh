#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

APP_DIR=${APP_DIR:-/opt/lrt/current}
ENV_FILE=${ENV_FILE:-/opt/lrt/shared/.env}
BACKUP_DIR=${BACKUP_DIR:-/var/backups/lrt}
RETENTION_DAYS=${RETENTION_DAYS:-14}
mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
dump="$BACKUP_DIR/lrt-$timestamp.dump"
partial="$dump.partial"
compose=(docker compose --project-name lrt --env-file "$ENV_FILE" --file "$APP_DIR/compose.yaml")

"${compose[@]}" exec -T db sh -ec 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$partial"
test -s "$partial"
mv "$partial" "$dump"
(cd "$BACKUP_DIR" && sha256sum "$(basename "$dump")" > "$(basename "$dump").sha256")
find "$BACKUP_DIR" -type f -name 'lrt-*.dump*' -mtime "+$RETENTION_DAYS" -delete
echo "Backup created: $dump"
