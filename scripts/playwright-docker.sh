#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

RELEASE_REF="${PLAYWRIGHT_RELEASE_REF:-}"
RELEASE_MODE="${PLAYWRIGHT_RELEASE_MODE:-test}"
RELEASE_OUTPUT="${PLAYWRIGHT_RELEASE_OUTPUT:-${PROJECT_DIR}/playwright-artifacts/release}"

if [ -n "$RELEASE_REF" ]; then
  if [[ ! "$RELEASE_REF" =~ ^[a-f0-9]{40}$ ]] || [[ ! "${PLAYWRIGHT_RELEASE_VERSION:-}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
    echo "Error: release mode requires a commit SHA and a pinned Playwright version" >&2
    exit 1
  fi
  if [[ "$RELEASE_MODE" != test && "$RELEASE_MODE" != report ]]; then
    echo "Error: PLAYWRIGHT_RELEASE_MODE must be test or report" >&2
    exit 1
  fi
  PLAYWRIGHT_VERSION="$PLAYWRIGHT_RELEASE_VERSION"
else
  RELEASE_MODE=test
  PLAYWRIGHT_VERSION=$(node -e "console.log(require('./package-lock.json').packages['node_modules/@playwright/test'].version)")
fi

if [ "$RELEASE_MODE" = test ] && [ -z "${PLAYWRIGHT_APP_BACKEND:-}" ]; then
  echo "Error: PLAYWRIGHT_APP_BACKEND is required. Start a backend separately and pass its URL." >&2
  exit 1
fi

if [ -n "$RELEASE_REF" ] && [ "$RELEASE_MODE" = test ] && [ -n "${PLAYWRIGHT_BASE_URL:-}" ]; then
  echo "Error: PLAYWRIGHT_BASE_URL must be unset for release tests so Playwright starts npm start" >&2
  exit 1
fi

if [ -z "$PLAYWRIGHT_VERSION" ]; then
  echo "Error: Could not determine Playwright version from package-lock.json" >&2
  exit 1
fi

PLAYWRIGHT_BACKEND=""
PLAYWRIGHT_PROXY_TARGET=""
if [ "$RELEASE_MODE" = test ]; then
  BACKEND_CONFIG="$(node .github/workflows/scripts/resolve-playwright-backend.js "$PLAYWRIGHT_APP_BACKEND")"
  IFS=$'\t' read -r PLAYWRIGHT_BACKEND PLAYWRIGHT_PROXY_TARGET <<< "$BACKEND_CONFIG"
fi

DOCKER_IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"
RUN_ID="$(date +%Y%m%d%H%M%S)-$$"
REPORT_DIR="${PROJECT_DIR}/playwright-artifacts/playwright-report"
PLAYWRIGHT_OUTPUT_DIR="/work/playwright-artifacts/test-results-${RUN_ID}"
REPORT_HOST="${PLAYWRIGHT_HTML_HOST:-127.0.0.1}"
REPORT_PORT="${PLAYWRIGHT_HTML_PORT:-9323}"
SHOULD_SHOW_REPORT="${PLAYWRIGHT_SHOW_REPORT:-}"
PLAYWRIGHT_BASE_URL_VALUE="${PLAYWRIGHT_BASE_URL:-}"
PLAYWRIGHT_PLATFORM="${PLAYWRIGHT_PLATFORM:-}"
PWTEST_SHARD_WEIGHTS="${PWTEST_SHARD_WEIGHTS:-}"

PLAYWRIGHT_COMMAND=$(cat <<'SCRIPT'
set -euo pipefail

if [ -n "${PLAYWRIGHT_RELEASE_REF:-}" ]; then
  # Release code is only extracted and executed inside this container. The host's
  # workspace, Docker socket and GitHub cache/artifact credentials are not mounted.
  curl --fail --location --retry 2 --max-time 120 \
    "https://codeload.github.com/ydb-platform/ydb-embedded-ui/tar.gz/${PLAYWRIGHT_RELEASE_REF}" \
    --output /tmp/ui-source.tar.gz
  tar -xzf /tmp/ui-source.tar.gz --strip-components=1 -C /work
fi

if [ -n "${PLAYWRIGHT_PROXY_TARGET:-}" ]; then
  node <<'NODE' &
const net = require('net');
const target = new URL(process.env.PLAYWRIGHT_PROXY_TARGET);
const port = Number(target.port || (target.protocol === 'https:' ? 443 : 80));
const server = net.createServer((client) => {
  const upstream = net.connect(port, target.hostname);
  client.pipe(upstream);
  upstream.pipe(client);
  client.on('error', () => upstream.destroy());
  upstream.on('error', () => client.destroy());
});
server.on('error', (error) => {
  console.error(`Backend proxy failed: ${error.message}`);
  process.exit(1);
});
server.listen(8765, '127.0.0.1', () => {
  console.log(`Forwarding localhost:8765 to ${target.hostname}:${port}`);
});
NODE
fi

echo "Running npm ci"
if [ "${PLAYWRIGHT_RELEASE_MODE:-test}" = report ]; then
  npm ci --ignore-scripts
  reports=$(mktemp -d)
  cp ./all-blob-reports/*.zip "$reports/"
  exec npx --no playwright merge-reports --config=merge.config.ts "$reports"
fi
npm ci

echo "Running Playwright tests"
npx playwright test --config=playwright.config.ts "$@"
SCRIPT
)

echo "Using Playwright Docker image: ${DOCKER_IMAGE}"
echo "Using backend: ${PLAYWRIGHT_APP_BACKEND:-}"
if [ -n "$PLAYWRIGHT_PROXY_TARGET" ]; then
  echo "Using container backend proxy: ${PLAYWRIGHT_BACKEND} -> ${PLAYWRIGHT_PROXY_TARGET}"
fi

DOCKER_RUN_ARGS=(run --rm)
if [ -n "$PLAYWRIGHT_PLATFORM" ]; then
  echo "Requested Playwright platform: ${PLAYWRIGHT_PLATFORM}"
  DOCKER_RUN_ARGS+=(--platform "$PLAYWRIGHT_PLATFORM")
fi

if [ -n "$RELEASE_REF" ]; then
  mkdir -p "$RELEASE_OUTPUT/blob-report" "$RELEASE_OUTPUT/playwright-artifacts"
  RELEASE_OUTPUT="$(cd "$RELEASE_OUTPUT" && pwd)"
  DOCKER_RUN_ARGS+=(
    -v "$RELEASE_OUTPUT/blob-report:/work/blob-report"
    -v "$RELEASE_OUTPUT/playwright-artifacts:/work/playwright-artifacts"
  )
  if [ "$RELEASE_MODE" = report ]; then
    DOCKER_RUN_ARGS+=(-v "$RELEASE_OUTPUT/all-blob-reports:/work/all-blob-reports:ro")
  fi
  REPORT_DIR="$RELEASE_OUTPUT/playwright-artifacts/playwright-report"
else
  DOCKER_RUN_ARGS+=(
    -v "${PROJECT_DIR}:/work"
    -v "ydb-embedded-ui-node-modules:/work/node_modules"
  )
fi

echo "Installing dependencies and running Playwright tests in Docker"
set +e
docker "${DOCKER_RUN_ARGS[@]}" \
  --add-host host.docker.internal:host-gateway \
  -w /work \
  -e CI="${CI:-}" \
  -e PLAYWRIGHT_VIDEO="${PLAYWRIGHT_VIDEO:-}" \
  -e PWTEST_SHARD_WEIGHTS="${PWTEST_SHARD_WEIGHTS}" \
  -e PLAYWRIGHT_APP_BACKEND="${PLAYWRIGHT_BACKEND}" \
  -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL_VALUE}" \
  -e PLAYWRIGHT_OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR}" \
  -e PLAYWRIGHT_PROXY_TARGET="${PLAYWRIGHT_PROXY_TARGET}" \
  -e PLAYWRIGHT_RELEASE_REF="$RELEASE_REF" \
  -e PLAYWRIGHT_RELEASE_MODE="$RELEASE_MODE" \
  "${DOCKER_IMAGE}" \
  /bin/bash -c "$PLAYWRIGHT_COMMAND" -- "$@"
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
