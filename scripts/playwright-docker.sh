#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

PLAYWRIGHT_VERSION=$(node -e "console.log(require('./package-lock.json').packages['node_modules/@playwright/test'].version)")
if [ -z "$PLAYWRIGHT_VERSION" ]; then
  echo "Error: Could not determine Playwright version from package-lock.json" >&2
  exit 1
fi
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
  /bin/bash -c 'npm ci && npx playwright test --config=playwright.config.ts "$@"' -- "$@"
