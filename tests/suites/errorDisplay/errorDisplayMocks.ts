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
