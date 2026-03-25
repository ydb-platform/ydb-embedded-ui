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
REPORT_DIR="${PROJECT_DIR}/playwright-artifacts/playwright-report"
REPORT_HOST="${PLAYWRIGHT_HTML_HOST:-127.0.0.1}"
REPORT_PORT="${PLAYWRIGHT_HTML_PORT:-9323}"
SHOULD_SHOW_REPORT="${PLAYWRIGHT_SHOW_REPORT:-}"

echo "Using Playwright Docker image: ${DOCKER_IMAGE}"

# NOTE: --network host only works on Linux.
# On macOS/Windows Docker Desktop, localhost inside the container does not reach the host.
# Use PLAYWRIGHT_BASE_URL=http://host.docker.internal:PORT as a workaround on those platforms.

set +e
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
TEST_EXIT_CODE=$?
set -e

if [ -n "$SHOULD_SHOW_REPORT" ]; then
  if [ ! -d "$REPORT_DIR" ]; then
    echo "Playwright HTML report was not found in ${REPORT_DIR}" >&2
    exit "$TEST_EXIT_CODE"
  fi

  echo "Serving Playwright HTML report at http://${REPORT_HOST}:${REPORT_PORT}"
  npx playwright show-report "$REPORT_DIR" --host "$REPORT_HOST" --port "$REPORT_PORT"
fi

exit "$TEST_EXIT_CODE"
