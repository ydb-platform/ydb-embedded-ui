import type {Page} from '@playwright/test';

import {backend} from '../../utils/constants';

const CLUSTER_ROUTE = `${backend}/viewer/json/cluster*`;

const EXPOSED_HEADERS = [
    'traceresponse',
    'x-trace-id',
    'x-request-id',
    'x-proxy-name',
    'x-worker-name',
].join(', ');

export async function setup400PlainTextMock(page: Page) {
    await page.route(CLUSTER_ROUTE, async (route) => {
        await route.fulfill({
            status: 400,
            contentType: 'text/plain',
            body: 'Cluster not found',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                traceresponse: '00-aabbccdd11223344aabbccdd11223344-1122334455667788-00',
                'x-request-id': 'test-req-id-e2e-400',
            },
        });
    });
}

export async function setup503EmptyBodyMock(page: Page) {
    await page.route(CLUSTER_ROUTE, async (route) => {
        await route.fulfill({
            status: 503,
            body: '',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                'x-worker-name': 'test-worker-node.example.net:8765',
            },
        });
    });
}

export async function setup429WithIssuesMock(page: Page) {
    await page.route(CLUSTER_ROUTE, async (route) => {
        await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({
                issues: [{issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'}],
                error: {issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'},
                status: 'OVERLOADED',
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
            },
        });
    });
}

export async function setup500ServerErrorMock(page: Page) {
    await page.route(CLUSTER_ROUTE, async (route) => {
        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({error: 'Internal server error'}),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
            },
        });
    });
}

export async function setupNetworkErrorMock(page: Page) {
    await page.route(CLUSTER_ROUTE, async (route) => {
        await route.abort('failed');
    });
}

export async function setup429HtmlMock(page: Page) {
    await page.route(CLUSTER_ROUTE, async (route) => {
        await route.fulfill({
            status: 429,
            contentType: 'text/html',
            body: '<html><body><h1>429 Too Many Requests</h1><p><main>: Error: Throughput limit exceeded, code: 200803 </p></body></html>',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
            },
        });
    });
}

export async function setup502WithProxyMock(page: Page) {
    await page.route(CLUSTER_ROUTE, async (route) => {
        await route.fulfill({
            status: 502,
            body: '',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                'x-trace-id': 'e2etest00112233445566778899aabbcc',
                'x-proxy-name': 'https://test-proxy-node.example.net:443',
                'x-request-id': 'test-req-id-e2e-502',
            },
        });
    });
}

const CAPABILITIES_ROUTE = `${backend}/viewer/capabilities*`;

export async function setup401CapabilitiesNoAuthUrlMock(page: Page) {
    await page.route(CAPABILITIES_ROUTE, async (route) => {
        await route.fulfill({
            status: 401,
            contentType: 'application/json; charset=utf-8',
            body: JSON.stringify({code: 'NEED_RESET'}),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                'x-request-id': 'test-req-id-e2e-401-caps',
            },
        });
    });
}

const WHOAMI_ROUTE = `${backend}/viewer/json/whoami*`;

export async function setupWhoami500Mock(page: Page) {
    await page.route(WHOAMI_ROUTE, async (route) => {
        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({error: 'Authentication service unavailable'}),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                traceresponse: '00-whoamitrace1122334455667788aabb-9900112233445566-00',
                'x-request-id': 'test-req-id-e2e-whoami-500',
            },
        });
    });
}

export async function setupWhoami503TextBodyMock(page: Page) {
    await page.route(WHOAMI_ROUTE, async (route) => {
        await route.fulfill({
            status: 503,
            contentType: 'text/plain',
            body: 'Database connection pool exhausted',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                'x-worker-name': 'auth-worker-03.example.net:8765',
            },
        });
    });
}

export async function setupWhoamiNetworkErrorMock(page: Page) {
    await page.route(WHOAMI_ROUTE, async (route) => {
        await route.abort('failed');
    });
}

export async function setupWhoami401NoAuthUrlMock(page: Page) {
    await page.route(WHOAMI_ROUTE, async (route) => {
        await route.fulfill({
            status: 401,
            contentType: 'application/json; charset=utf-8',
            body: JSON.stringify({code: 'NEED_RESET'}),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                'x-request-id': 'test-req-id-e2e-401-whoami',
            },
        });
    });
}
