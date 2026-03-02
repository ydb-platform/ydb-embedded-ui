import {createServer} from 'http';
import type {AddressInfo} from 'net';

import type {Page, Route} from '@playwright/test';

import {backend} from '../../utils/constants';

const EXPOSED_HEADERS = [
    'traceresponse',
    'x-trace-id',
    'x-request-id',
    'x-proxy-name',
    'x-worker-name',
].join(', ');

// API routes per page (matched by Playwright page.route)
const ROUTES = {
    cluster: `${backend}/viewer/json/cluster*`,
    sysinfo: `${backend}/viewer/json/sysinfo*`,
    pdiskInfo: `${backend}/pdisk/info*`,
    storageGroups: `${backend}/storage/groups*`,
    storageInfo: `${backend}/viewer/json/storage*`,
    tabletInfo: `${backend}/viewer/json/tabletinfo*`,
    describe: `${backend}/viewer/json/describe*`,
    whoami: `${backend}/viewer/json/whoami*`,
    capabilities: `${backend}/viewer/capabilities*`,
} as const;

interface FulfillOptions {
    status: number;
    body?: string;
    contentType?: string;
    headers?: Record<string, string>;
}

async function mockRoute(page: Page, pattern: string, options: FulfillOptions) {
    await page.route(pattern, async (route: Route) => {
        await route.fulfill({
            status: options.status,
            contentType: options.contentType ?? 'application/json',
            body: options.body ?? JSON.stringify({error: `HTTP ${options.status}`}),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                ...options.headers,
            },
        });
    });
}

// Each page tests a different error type to maximize coverage:
//   Cluster   → 400 plain text + trace headers
//   Node      → network error (abort)
//   PDisk     → 503 empty body + x-worker-name
//   VDisk     → 429 JSON with issues
//   StorageGroup → 429 HTML body + x-proxy-name + x-trace-id
//   Tablet    → 400 JSON with code field only
//   Whoami    → 500 JSON + trace headers (full-page PageError)
//   Tenant    → 403 (AccessDenied)
//   Capabilities → 401 (AccessDenied)

export async function setupCluster400PlainTextMock(page: Page) {
    await mockRoute(page, ROUTES.cluster, {
        status: 400,
        contentType: 'text/plain',
        body: 'Cluster not found',
        headers: {
            traceresponse: '00-aabbccdd11223344aabbccdd11223344-1122334455667788-00',
            'x-request-id': 'test-req-id-e2e-400',
        },
    });
}

export async function setupNodeNetworkErrorMock(page: Page) {
    await page.route(ROUTES.sysinfo, async (route: Route) => {
        await route.abort('failed');
    });
}

export async function setupPDisk503EmptyBodyMock(page: Page) {
    await mockRoute(page, ROUTES.pdiskInfo, {
        status: 503,
        body: '',
        headers: {
            'x-worker-name': 'test-worker-node.example.net:8765',
        },
    });
}

export async function setupVDisk429WithIssuesMock(page: Page) {
    await mockRoute(page, ROUTES.storageGroups, {
        status: 429,
        body: JSON.stringify({
            issues: [{issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'}],
            error: {issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'},
            status: 'OVERLOADED',
        }),
    });
}

export async function setupStorageGroup429HtmlMock(page: Page) {
    const html =
        '<html><body><h1>429 Too Many Requests</h1><p>Rate limit exceeded</p></body></html>';
    await mockRoute(page, ROUTES.storageGroups, {
        status: 429,
        contentType: 'text/html',
        body: html,
        headers: {
            'x-trace-id': 'e2etest00112233445566778899aabbcc',
            'x-proxy-name': 'https://test-proxy-node.example.net:443',
        },
    });
    await mockRoute(page, ROUTES.storageInfo, {
        status: 429,
        contentType: 'text/html',
        body: html,
        headers: {
            'x-trace-id': 'e2etest00112233445566778899aabbcc',
            'x-proxy-name': 'https://test-proxy-node.example.net:443',
        },
    });
}

export async function setupTablet400JsonCodeOnlyMock(page: Page) {
    await mockRoute(page, ROUTES.tabletInfo, {
        status: 400,
        body: JSON.stringify({code: 'NEED_RESET'}),
    });
}

export async function setupWhoami500Mock(page: Page) {
    await mockRoute(page, ROUTES.whoami, {
        status: 500,
        body: JSON.stringify({error: 'Authentication service unavailable'}),
        headers: {
            traceresponse: '00-whoamitrace1122334455667788aabb-9900112233445566-00',
            'x-request-id': 'test-req-id-e2e-whoami-500',
        },
    });
}

export async function setupWhoami503TextMock(page: Page) {
    await mockRoute(page, ROUTES.whoami, {
        status: 503,
        contentType: 'text/plain',
        body: 'Database connection pool exhausted',
        headers: {
            'x-worker-name': 'auth-worker-03.example.net:8765',
        },
    });
}

export async function setupWhoamiNetworkErrorMock(page: Page) {
    await page.route(ROUTES.whoami, async (route: Route) => {
        await route.abort('failed');
    });
}

export async function setupWhoami502HtmlMock(page: Page) {
    const html =
        '<html><body><h1>502 Bad Gateway</h1><p>The upstream server returned an invalid response</p></body></html>';
    await mockRoute(page, ROUTES.whoami, {
        status: 502,
        contentType: 'text/html',
        body: html,
        headers: {
            'x-proxy-name': 'https://auth-proxy-01.example.net:443',
            'x-trace-id': 'htmltrace0011223344556677',
        },
    });
}

export async function setupDescribe403Mock(page: Page) {
    await page.route(ROUTES.describe, async (route: Route) => {
        await route.fulfill({status: 403});
    });
}

export async function setupCapabilities401Mock(page: Page) {
    await mockRoute(page, ROUTES.capabilities, {
        status: 401,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({code: 'NEED_RESET'}),
        headers: {
            'x-request-id': 'test-req-id-e2e-401-caps',
        },
    });
}

// --- Query result error mocks ---

// Both endpoints are mocked for non-streaming tests as a safety net.
const QUERY_ROUTES = [`**/viewer/json/query?*`, `**/viewer/query?*`] as const;

// Only the streaming endpoint (fetch-based, no /json/ in path).
const STREAMING_QUERY_ROUTE = `**/viewer/query?*`;

export async function setupQueryResult500Mock(page: Page) {
    const options: FulfillOptions = {
        status: 500,
        body: JSON.stringify({error: 'Query execution failed: internal error'}),
        headers: {
            traceresponse: '00-querytr00112233445566778899aabb-1122334455667788-00',
            'x-request-id': 'test-req-id-e2e-query-500',
            'x-worker-name': 'query-worker-01.example.net:8765',
        },
    };
    for (const route of QUERY_ROUTES) {
        await mockRoute(page, route, options);
    }
}

export async function setupQueryResultNetworkErrorMock(page: Page) {
    for (const pattern of QUERY_ROUTES) {
        await page.route(pattern, async (route: Route) => {
            await route.abort('failed');
        });
    }
}

// --- Streaming query error mocks ---
// These mock only the streaming endpoint (/viewer/query, no /json/).
// Streaming experiment stays ON (default).

export async function setupStreamingQuery500Mock(page: Page) {
    await mockRoute(page, STREAMING_QUERY_ROUTE, {
        status: 500,
        body: JSON.stringify({error: 'Query execution failed: internal error'}),
        headers: {
            traceresponse: '00-streamtr0011223344556677889900-aabb112233445566-00',
            'x-request-id': 'test-req-id-e2e-stream-500',
            'x-worker-name': 'stream-worker-02.example.net:8765',
        },
    });
}

export async function setupStreamingQueryNetworkErrorMock(page: Page) {
    await page.route(STREAMING_QUERY_ROUTE, async (route: Route) => {
        await route.abort('failed');
    });
}

/**
 * Simulates a mid-stream network error by starting a real HTTP server that:
 * 1. Accepts the POST request
 * 2. Responds with HTTP 200 + trace headers + the beginning of a multipart body
 * 3. Destroys the socket after a short delay — simulating connection drop
 *
 * This reproduces the scenario where a long-running streaming query runs for
 * several minutes and then the connection breaks (ERR_INCOMPLETE_CHUNKED_ENCODING,
 * proxy timeout, TCP reset, etc.). The initial response headers are available
 * in the browser and should be shown in the error display.
 *
 * Returns a cleanup function to close the server.
 */
export async function setupStreamingQueryMidStreamErrorMock(
    page: Page,
): Promise<() => Promise<void>> {
    const BOUNDARY = 'boundary';
    const sessionChunk = JSON.stringify({
        meta: {event: 'SessionCreated', node_id: 1, query_id: 'q1', session_id: 's1'},
    });

    const server = createServer((req, res) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept, X-CSRF-Token',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
            });
            res.end();
            return;
        }

        res.writeHead(200, {
            'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': EXPOSED_HEADERS,
            traceresponse: '00-midstreamtrace1122334455667788-aabb112233445566-00',
            'x-worker-name': 'stream-worker-midstream.example.net:8765',
        });

        // Send first valid chunk (session)
        res.write(`--${BOUNDARY}\r\nContent-Type: application/json\r\n\r\n${sessionChunk}\r\n`);

        // After a short delay, kill the connection — simulating network drop
        setTimeout(() => {
            req.socket.destroy();
        }, 100);
    });

    await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve());
    });

    const {port} = server.address() as AddressInfo;

    // Redirect the streaming query endpoint to our mock server
    await page.route(STREAMING_QUERY_ROUTE, async (route: Route) => {
        const url = new URL(route.request().url());
        url.hostname = '127.0.0.1';
        url.port = String(port);
        url.protocol = 'http:';
        await route.continue({url: url.toString()});
    });

    return async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });
    };
}
