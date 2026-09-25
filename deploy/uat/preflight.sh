#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT_DIR"

if docker compose version >/dev/null 2>&1; then
  docker compose -p lrt config >/dev/null
else
  docker-compose -p lrt config >/dev/null
fi
npm test --workspace=backend -- --runInBand test/unit
npm test --workspace=frontend
npm run build --workspace=backend
npm run build --workspace=frontend

for script in backend/test/*.cjs backend/prisma/*.cjs deploy/uat/*.cjs; do
  [ -f "$script" ] || continue
  node --check "$script"
done

echo "LRT preflight passed."
