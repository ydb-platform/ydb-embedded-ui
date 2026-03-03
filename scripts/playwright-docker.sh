#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

PLAYWRIGHT_VERSION=$(node -e "console.log(require('@playwright/test/package.json').version)")
DOCKER_IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

echo "Using Playwright Docker image: ${DOCKER_IMAGE}"

EXTRA_ARGS="${*:-}"

docker run --rm --network host \
  -v "${PROJECT_DIR}:/work" \
  -v "ydb-embedded-ui-node-modules:/work/node_modules" \
  -w /work \
  -e CI="${CI:-}" \
  -e PLAYWRIGHT_VIDEO="${PLAYWRIGHT_VIDEO:-}" \
  -e PLAYWRIGHT_APP_BACKEND="${PLAYWRIGHT_APP_BACKEND:-}" \
  -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-}" \
  "${DOCKER_IMAGE}" \
  /bin/bash -c "npm ci && npx playwright test --config=playwright.config.ts ${EXTRA_ARGS}"
