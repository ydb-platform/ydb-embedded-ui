#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ ! -d "node_modules/@playwright/test" ]; then
  echo "Error: @playwright/test not found. Run 'npm ci' first." >&2
  exit 1
fi

PLAYWRIGHT_VERSION=$(node -e "console.log(require('@playwright/test/package.json').version)")
DOCKER_IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

echo "Using Playwright Docker image: ${DOCKER_IMAGE}"

echo "Pulling Docker image (timeout: 5 minutes)..."
timeout 300 docker pull "${DOCKER_IMAGE}" || {
  echo "Error: Docker image pull timed out or failed" >&2
  exit 1
}

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
  /bin/bash -c 'timeout 180 npm ci && npx playwright test --config=playwright.config.ts "$@"' -- "$@"
