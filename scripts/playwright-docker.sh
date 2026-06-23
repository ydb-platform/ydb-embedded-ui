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
YDB_IMAGE="${PLAYWRIGHT_YDB_IMAGE:-ghcr.io/ydb-platform/local-ydb:nightly}"
RUN_ID="$(date +%Y%m%d%H%M%S)-$$"
YDB_CONTAINER_NAME="${PLAYWRIGHT_YDB_CONTAINER_NAME:-ydb-e2e-local-ydb-${RUN_ID}}"
NETWORK_NAME="${PLAYWRIGHT_DOCKER_NETWORK:-ydb-e2e-network}"
REPORT_DIR="${PROJECT_DIR}/playwright-artifacts/playwright-report"
PLAYWRIGHT_OUTPUT_DIR="/work/playwright-artifacts/test-results-${RUN_ID}"
REPORT_HOST="${PLAYWRIGHT_HTML_HOST:-127.0.0.1}"
REPORT_PORT="${PLAYWRIGHT_HTML_PORT:-9323}"
SHOULD_SHOW_REPORT="${PLAYWRIGHT_SHOW_REPORT:-}"
EXTERNAL_BACKEND="${PLAYWRIGHT_APP_BACKEND:-}"
DEFAULT_INTERNAL_BACKEND="http://${YDB_CONTAINER_NAME}:8765"
INTERNAL_BROWSER_BACKEND="http://localhost:8765"
PLAYWRIGHT_BACKEND="${EXTERNAL_BACKEND:-$INTERNAL_BROWSER_BACKEND}"
PLAYWRIGHT_BASE_URL_VALUE="${PLAYWRIGHT_BASE_URL:-}"
PLAYWRIGHT_NPM_CACHE_DIR_VALUE="${PLAYWRIGHT_NPM_CACHE_DIR:-}"
PLAYWRIGHT_WORKERS_VALUE="${PLAYWRIGHT_WORKERS:-}"
PWTEST_SHARD_WEIGHTS_VALUE="${PWTEST_SHARD_WEIGHTS:-}"
DEFAULT_YDB_ALLOW_ORIGIN="http://localhost:3000"
YDB_ALLOW_ORIGIN="${PLAYWRIGHT_YDB_ALLOW_ORIGIN:-$DEFAULT_YDB_ALLOW_ORIGIN}"
YDB_PLATFORM="${PLAYWRIGHT_YDB_PLATFORM:-}"
PLAYWRIGHT_PLATFORM="${PLAYWRIGHT_PLATFORM:-}"
START_INTERNAL_BACKEND=0
NETWORK_CREATED=0
YDB_CONTAINER_STARTED=0
YDB_PROXY_TARGET=""

if [ -z "$EXTERNAL_BACKEND" ]; then
  START_INTERNAL_BACKEND=1
  YDB_PROXY_TARGET="$DEFAULT_INTERNAL_BACKEND"
elif [[ "$EXTERNAL_BACKEND" =~ ^https?://(localhost|127\.0\.0\.1)(:|/|$) ]]; then
  YDB_PROXY_TARGET="${EXTERNAL_BACKEND//localhost/host.docker.internal}"
  YDB_PROXY_TARGET="${YDB_PROXY_TARGET//127.0.0.1/host.docker.internal}"
fi

if [ -z "${PLAYWRIGHT_YDB_ALLOW_ORIGIN:-}" ] && [ -n "$PLAYWRIGHT_BASE_URL_VALUE" ]; then
  YDB_ALLOW_ORIGIN=$(PLAYWRIGHT_BASE_URL="$PLAYWRIGHT_BASE_URL_VALUE" node <<'NODE'
try {
  console.log(new URL(process.env.PLAYWRIGHT_BASE_URL).origin);
} catch (error) {
  console.error(`Error: PLAYWRIGHT_BASE_URL must be an absolute URL, got "${process.env.PLAYWRIGHT_BASE_URL}"`);
  process.exit(1);
}
NODE
)
fi

DOCKER_NPM_CACHE_ARGS=()
DOCKER_NPM_CACHE_ENV_ARGS=()
NPM_CI_COMMAND="npm ci"

if [ -n "$PLAYWRIGHT_NPM_CACHE_DIR_VALUE" ]; then
  mkdir -p "$PLAYWRIGHT_NPM_CACHE_DIR_VALUE"
  DOCKER_NPM_CACHE_ARGS=(-v "${PLAYWRIGHT_NPM_CACHE_DIR_VALUE}:/npm-cache")
  DOCKER_NPM_CACHE_ENV_ARGS=(-e NPM_CONFIG_CACHE="/npm-cache")
  NPM_CI_COMMAND="npm ci --prefer-offline"
fi

cleanup() {
  if [ "$YDB_CONTAINER_STARTED" -eq 1 ]; then
    echo "Cleaning up YDB backend container ${YDB_CONTAINER_NAME}"
    docker rm -f "$YDB_CONTAINER_NAME" >/dev/null 2>&1 || true
  fi

  if [ "$NETWORK_CREATED" -eq 1 ]; then
    echo "Cleaning up Docker network ${NETWORK_NAME}"
    docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

print_ydb_diagnostics() {
  echo "--- YDB container status ---"
  docker ps -a --filter "name=^/${YDB_CONTAINER_NAME}$" --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}' || true
  echo "--- YDB recent logs ---"
  docker logs --tail 50 "$YDB_CONTAINER_NAME" 2>&1 || true
  echo "--- YDB inspect state ---"
  docker inspect "$YDB_CONTAINER_NAME" --format 'status={{.State.Status}} running={{.State.Running}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} exit={{.State.ExitCode}} error={{.State.Error}}' 2>/dev/null || true
}

print_elapsed() {
  local label="$1"
  local started_at="$2"
  local finished_at

  finished_at="$(date +%s)"
  echo "${label} completed in $((finished_at - started_at))s"
}

wait_for_ydb() {
  local max_attempts=60
  local attempt=1
  local health_status

  while [ "$attempt" -le "$max_attempts" ]; do
    health_status="$(docker inspect "$YDB_CONTAINER_NAME" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' 2>/dev/null || true)"

    if [ "$health_status" = "healthy" ]; then
      echo "YDB backend is ready at ${DEFAULT_INTERNAL_BACKEND}"
      return 0
    fi

    echo "Waiting for YDB backend to become ready (${attempt}/${max_attempts}), status: ${health_status:-unknown}"
    if [ "$attempt" -eq 1 ] || [ $((attempt % 10)) -eq 0 ]; then
      print_ydb_diagnostics
    fi
    sleep 2
    attempt=$((attempt + 1))
  done

  echo "Error: YDB backend did not become ready at ${DEFAULT_INTERNAL_BACKEND}" >&2
  print_ydb_diagnostics >&2
  return 1
}

PLAYWRIGHT_COMMAND=$(cat <<'SCRIPT'
set -euo pipefail

print_elapsed() {
  local label="$1"
  local started_at="$2"
  local finished_at

  finished_at="$(date +%s)"
  echo "${label} completed in $((finished_at - started_at))s"
}

if [ -n "${PLAYWRIGHT_YDB_PROXY_TARGET:-}" ]; then
  echo "Forwarding localhost:8765 to ${PLAYWRIGHT_YDB_PROXY_TARGET}"
  node <<'NODE' &
const net = require('net');
const target = new URL(process.env.PLAYWRIGHT_YDB_PROXY_TARGET);
const port = Number(target.port || 80);
const server = net.createServer((client) => {
  const upstream = net.connect(port, target.hostname);
  client.pipe(upstream);
  upstream.pipe(client);
  client.on('error', () => upstream.destroy());
  upstream.on('error', () => client.destroy());
});
server.listen(8765, '127.0.0.1');
NODE
fi

echo "Running ${NPM_CI_COMMAND}"
npm_ci_started_at="$(date +%s)"
${NPM_CI_COMMAND}
print_elapsed "npm install" "$npm_ci_started_at"

echo "Running Playwright tests"
npx playwright test --config=playwright.config.ts "$@"
SCRIPT
)

echo "Using Playwright Docker image: ${DOCKER_IMAGE}"
echo "Using YDB Docker image: ${YDB_IMAGE}"
echo "Docker network: ${NETWORK_NAME}"
if [ -n "$PLAYWRIGHT_NPM_CACHE_DIR_VALUE" ]; then
  echo "Using npm cache directory: ${PLAYWRIGHT_NPM_CACHE_DIR_VALUE}"
fi
if [ -n "$PWTEST_SHARD_WEIGHTS_VALUE" ]; then
  echo "Using Playwright shard weights: ${PWTEST_SHARD_WEIGHTS_VALUE}"
fi
if [ -n "$PLAYWRIGHT_WORKERS_VALUE" ]; then
  echo "Using Playwright workers: ${PLAYWRIGHT_WORKERS_VALUE}"
fi

if [ "$START_INTERNAL_BACKEND" -eq 1 ]; then
  echo "Starting YDB backend container: ${YDB_IMAGE}"
  echo "Allowed YDB CORS origin: ${YDB_ALLOW_ORIGIN}"
  if [ -n "$YDB_PLATFORM" ]; then
    echo "Requested YDB platform: ${YDB_PLATFORM}"
  fi
  if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    docker network create "$NETWORK_NAME" >/dev/null
    NETWORK_CREATED=1
  fi
  if [ -n "$YDB_PLATFORM" ]; then
    docker run -d --rm \
      --platform "$YDB_PLATFORM" \
      --name "$YDB_CONTAINER_NAME" \
      --hostname localhost \
      --network "$NETWORK_NAME" \
      -e YDB_ALLOW_ORIGIN="$YDB_ALLOW_ORIGIN" \
      "$YDB_IMAGE"
  else
    docker run -d --rm \
      --name "$YDB_CONTAINER_NAME" \
      --hostname localhost \
      --network "$NETWORK_NAME" \
      -e YDB_ALLOW_ORIGIN="$YDB_ALLOW_ORIGIN" \
      "$YDB_IMAGE"
  fi
  YDB_CONTAINER_STARTED=1
  print_ydb_diagnostics
  wait_for_ydb
else
  echo "Using external backend: ${EXTERNAL_BACKEND}"
fi

echo "Installing dependencies and running Playwright tests in Docker"
playwright_docker_started_at="$(date +%s)"
set +e
if [ -n "$PLAYWRIGHT_PLATFORM" ] && [ "$START_INTERNAL_BACKEND" -eq 1 ]; then
  echo "Requested Playwright platform: ${PLAYWRIGHT_PLATFORM}"
  docker run --rm \
    --platform "$PLAYWRIGHT_PLATFORM" \
    --network "$NETWORK_NAME" \
    --add-host host.docker.internal:host-gateway \
    -v "${PROJECT_DIR}:/work" \
    -v "ydb-embedded-ui-node-modules:/work/node_modules" \
    "${DOCKER_NPM_CACHE_ARGS[@]}" \
    -w /work \
    -e CI="${CI:-}" \
    -e PLAYWRIGHT_VIDEO="${PLAYWRIGHT_VIDEO:-}" \
    -e PLAYWRIGHT_APP_BACKEND="${PLAYWRIGHT_BACKEND}" \
    -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL_VALUE}" \
    -e PLAYWRIGHT_OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR}" \
    -e PLAYWRIGHT_YDB_PROXY_TARGET="${YDB_PROXY_TARGET}" \
    -e PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS_VALUE}" \
    -e PWTEST_SHARD_WEIGHTS="${PWTEST_SHARD_WEIGHTS_VALUE}" \
    -e NPM_CI_COMMAND="${NPM_CI_COMMAND}" \
    "${DOCKER_NPM_CACHE_ENV_ARGS[@]}" \
    "${DOCKER_IMAGE}" \
    /bin/bash -c "$PLAYWRIGHT_COMMAND" -- "$@"
elif [ -n "$PLAYWRIGHT_PLATFORM" ]; then
  echo "Requested Playwright platform: ${PLAYWRIGHT_PLATFORM}"
  docker run --rm \
    --platform "$PLAYWRIGHT_PLATFORM" \
    --add-host host.docker.internal:host-gateway \
    -v "${PROJECT_DIR}:/work" \
    -v "ydb-embedded-ui-node-modules:/work/node_modules" \
    "${DOCKER_NPM_CACHE_ARGS[@]}" \
    -w /work \
    -e CI="${CI:-}" \
    -e PLAYWRIGHT_VIDEO="${PLAYWRIGHT_VIDEO:-}" \
    -e PLAYWRIGHT_APP_BACKEND="${PLAYWRIGHT_BACKEND}" \
    -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL_VALUE}" \
    -e PLAYWRIGHT_OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR}" \
    -e PLAYWRIGHT_YDB_PROXY_TARGET="${YDB_PROXY_TARGET}" \
    -e PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS_VALUE}" \
    -e PWTEST_SHARD_WEIGHTS="${PWTEST_SHARD_WEIGHTS_VALUE}" \
    -e NPM_CI_COMMAND="${NPM_CI_COMMAND}" \
    "${DOCKER_NPM_CACHE_ENV_ARGS[@]}" \
    "${DOCKER_IMAGE}" \
    /bin/bash -c "$PLAYWRIGHT_COMMAND" -- "$@"
elif [ "$START_INTERNAL_BACKEND" -eq 1 ]; then
  docker run --rm \
    --network "$NETWORK_NAME" \
    --add-host host.docker.internal:host-gateway \
    -v "${PROJECT_DIR}:/work" \
    -v "ydb-embedded-ui-node-modules:/work/node_modules" \
    "${DOCKER_NPM_CACHE_ARGS[@]}" \
    -w /work \
    -e CI="${CI:-}" \
    -e PLAYWRIGHT_VIDEO="${PLAYWRIGHT_VIDEO:-}" \
    -e PLAYWRIGHT_APP_BACKEND="${PLAYWRIGHT_BACKEND}" \
    -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL_VALUE}" \
    -e PLAYWRIGHT_OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR}" \
    -e PLAYWRIGHT_YDB_PROXY_TARGET="${YDB_PROXY_TARGET}" \
    -e PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS_VALUE}" \
    -e PWTEST_SHARD_WEIGHTS="${PWTEST_SHARD_WEIGHTS_VALUE}" \
    -e NPM_CI_COMMAND="${NPM_CI_COMMAND}" \
    "${DOCKER_NPM_CACHE_ENV_ARGS[@]}" \
    "${DOCKER_IMAGE}" \
    /bin/bash -c "$PLAYWRIGHT_COMMAND" -- "$@"
else
  docker run --rm \
    --add-host host.docker.internal:host-gateway \
    -v "${PROJECT_DIR}:/work" \
    -v "ydb-embedded-ui-node-modules:/work/node_modules" \
    "${DOCKER_NPM_CACHE_ARGS[@]}" \
    -w /work \
    -e CI="${CI:-}" \
    -e PLAYWRIGHT_VIDEO="${PLAYWRIGHT_VIDEO:-}" \
    -e PLAYWRIGHT_APP_BACKEND="${PLAYWRIGHT_BACKEND}" \
    -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL_VALUE}" \
    -e PLAYWRIGHT_OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR}" \
    -e PLAYWRIGHT_YDB_PROXY_TARGET="${YDB_PROXY_TARGET}" \
    -e PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS_VALUE}" \
    -e PWTEST_SHARD_WEIGHTS="${PWTEST_SHARD_WEIGHTS_VALUE}" \
    -e NPM_CI_COMMAND="${NPM_CI_COMMAND}" \
    "${DOCKER_NPM_CACHE_ENV_ARGS[@]}" \
    "${DOCKER_IMAGE}" \
    /bin/bash -c "$PLAYWRIGHT_COMMAND" -- "$@"
fi
TEST_EXIT_CODE=$?
set -e
print_elapsed "Dockerized Playwright run" "$playwright_docker_started_at"

if [ -n "$SHOULD_SHOW_REPORT" ]; then
  if [ ! -d "$REPORT_DIR" ]; then
    echo "Playwright HTML report was not found in ${REPORT_DIR}" >&2
    exit "$TEST_EXIT_CODE"
  fi

  echo "Serving Playwright HTML report at http://${REPORT_HOST}:${REPORT_PORT}"
  npx playwright show-report "$REPORT_DIR" --host "$REPORT_HOST" --port "$REPORT_PORT"
fi

exit "$TEST_EXIT_CODE"
