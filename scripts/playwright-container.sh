#!/bin/bash
set -euo pipefail

if [ -n "${PLAYWRIGHT_RELEASE_REF:-}" ]; then
  # Release code is only extracted and executed inside this container. The host's
  # workspace, Docker socket and GitHub cache/artifact credentials are not mounted.
  fetch_source() {
    mkdir -p "$2"
    curl --fail --location --retry 2 --max-time 120 \
      "https://codeload.github.com/ydb-platform/ydb-embedded-ui/tar.gz/$1" \
      --output /tmp/ui-source.tar.gz
    tar -xzf /tmp/ui-source.tar.gz --strip-components=1 -C "$2"
  }
  fetch_source "$PLAYWRIGHT_RELEASE_TEST_REF" /work
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

config=playwright.config.ts
if [ -n "${PLAYWRIGHT_RELEASE_REF:-}" ] && [ "$PLAYWRIGHT_RELEASE_TEST_REF" != "$PLAYWRIGHT_RELEASE_REF" ]; then
  fetch_source "$PLAYWRIGHT_RELEASE_REF" /tmp/release-ui
  (cd /tmp/release-ui && npm ci)
  cat > release-playwright.config.ts <<'CONFIG'
import config from './playwright.config';

if (!config.webServer || Array.isArray(config.webServer)) {
    throw new Error('Release tests must define a single Playwright webServer');
}

export default {
    ...config,
    webServer: {
        ...config.webServer,
        command: 'npm start',
        cwd: '/tmp/release-ui',
        reuseExistingServer: false,
    },
};
CONFIG
  config=release-playwright.config.ts
fi

echo "Running Playwright tests"
npx playwright test --config="$config" "$@"
