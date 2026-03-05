#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ ! -f "package-lock.json" ]; then
  echo "Error: package-lock.json not found." >&2
  exit 1
fi

PLAYWRIGHT_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('package-lock.json','utf8')).packages['node_modules/@playwright/test'].version)")
DOCKER_IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

echo "Using Playwright Docker image: ${DOCKER_IMAGE}"

# NOTE: --network host only works on Linux.
# On macOS/Windows Docker Desktop, localhost inside the container does not reach the host.
# Use PLAYWRIGHT_BASE_URL=http://host.docker.internal:PORT as a workaround on those platforms.
docker run --rm --network host \
  -v "${PROJECT_DIR}:/work" \
  -v "ydb-embedded-ui-node-modules:/work/node_modules" \
  -w /work \
  -e CI="${CI:-}" \
  -e PLAYWRIGHT_VIDEO="${PLAYWRIGHT_VIDEO:-}" \
  -e PLAYWRIGHT_APP_BACKEND="${PLAYWRIGHT_APP_BACKEND:-}" \
  -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-}" \
  "${DOCKER_IMAGE}" \
  /bin/bash -c '
    LOCK_HASH=$(sha256sum package-lock.json | cut -d" " -f1)
    STORED_HASH=""
    if [ -f node_modules/.package-lock-hash ]; then
      STORED_HASH=$(cat node_modules/.package-lock-hash)
    fi
    if [ "$LOCK_HASH" != "$STORED_HASH" ]; then
      echo "package-lock.json changed, running npm ci..."
      npm ci
      echo "$LOCK_HASH" > node_modules/.package-lock-hash
    else
      echo "node_modules up to date, skipping npm ci"
    fi
    npx playwright test --config=playwright.config.ts "$@"
  ' -- "$@"
