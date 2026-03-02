import type {Page} from '@playwright/test';

import {backend} from '../../utils/constants';

const DESCRIBE_ROUTE = `${backend}/viewer/json/describe*`;

export async function setup400PlainTextMock(page: Page) {
    await page.route(DESCRIBE_ROUTE, async (route) => {
        await route.fulfill({
            status: 400,
            contentType: 'text/plain',
            body: 'Cluster not found',
            headers: {
                traceresponse: '00-aabbccdd11223344aabbccdd11223344-1122334455667788-00',
                'x-request-id': 'test-req-id-e2e-400',
            },
        });
    });
}

export async function setup503EmptyBodyMock(page: Page) {
    await page.route(DESCRIBE_ROUTE, async (route) => {
        await route.fulfill({
            status: 503,
            body: '',
            headers: {
                'x-worker-name': 'test-worker-node.example.net:8765',
            },
        });
    });
}

export async function setup429WithIssuesMock(page: Page) {
    await page.route(DESCRIBE_ROUTE, async (route) => {
        await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({
                issues: [{issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'}],
                error: {issue_code: 200803, severity: 1, message: 'Throughput limit exceeded'},
                status: 'OVERLOADED',
            }),
        });
    });
}

export async function setup500ServerErrorMock(page: Page) {
    await page.route(DESCRIBE_ROUTE, async (route) => {
        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({error: 'Internal server error'}),
        });
    });
}

export async function setupNetworkErrorMock(page: Page) {
    await page.route(DESCRIBE_ROUTE, async (route) => {
        await route.abort('failed');
    });
}

export async function setup403Mock(page: Page) {
    await page.route(DESCRIBE_ROUTE, async (route) => {
        await route.fulfill({status: 403});
    });
}

export async function setup429HtmlMock(page: Page) {
    await page.route(DESCRIBE_ROUTE, async (route) => {
        await route.fulfill({
            status: 429,
            contentType: 'text/html',
            body: '<html><body><h1>429 Too Many Requests</h1><p><main>: Error: Throughput limit exceeded, code: 200803 </p></body></html>',
        });
    });
}

export async function setup502WithProxyMock(page: Page) {
    await page.route(DESCRIBE_ROUTE, async (route) => {
        await route.fulfill({
            status: 502,
            body: '',
            headers: {
                'x-trace-id': 'e2etest00112233445566778899aabbcc',
                'x-proxy-name': 'https://test-proxy-node.example.net:443',
                'x-request-id': 'test-req-id-e2e-502',
            },
        });
    });
}
