import {expect, test} from '@playwright/test';

import {backend, database} from '../../utils/constants';
import {ClusterPage} from '../cluster/ClusterPage';
import {TenantPage} from '../tenant/TenantPage';

import {ErrorDisplayModel} from './ErrorDisplayModel';
import {
    setup400PlainTextMock,
    setup429HtmlMock,
    setup429WithIssuesMock,
    setup500ServerErrorMock,
    setup502WithProxyMock,
    setup503EmptyBodyMock,
    setupNetworkErrorMock,
} from './errorDisplayMocks';

test.describe.only('Error Display — ResponseError with Details', () => {
    test('HTTP 400 — plain text error with traceresponse and x-request-id', async ({page}) => {
        await setup400PlainTextMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Cluster not found');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('400');

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toBeTruthy();
        expect(url).toContain('/viewer/json/cluster');

        const traceId = await errorDisplay.getDetailValue('Trace-ID');
        expect(traceId).toBeTruthy();
        expect(traceId).toContain('aabbccdd11223344');

        const requestId = await errorDisplay.getDetailValue('Request-ID');
        expect(requestId).toBe('test-req-id-e2e-400');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-400-plain-text.png',
        );
    });

    test('HTTP 503 — empty body with x-worker-name', async ({page}) => {
        await setup503EmptyBodyMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Service Unavailable');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('503');

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toBeTruthy();

        const workerName = await errorDisplay.getDetailValue('x-worker-name');
        expect(workerName).toContain('test-worker-node');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-503-empty-body.png',
        );
    });

    test('HTTP 429 — rate limit with issues', async ({page}) => {
        await setup429WithIssuesMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Throughput limit exceeded');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('429');

        expect(await errorDisplay.isIssuesTriggerVisible()).toBe(true);
        await errorDisplay.expandIssues();

        const issuesText = await errorDisplay.getIssuesText();
        expect(issuesText).toContain('Throughput limit exceeded');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-429-with-issues.png',
        );
    });

    test('HTTP 429 — HTML body without structured issues', async ({page}) => {
        await setup429HtmlMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('429 Too Many Requests');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('429');

        expect(await errorDisplay.isIssuesTriggerVisible()).toBe(false);

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-429-html-body.png',
        );
    });

    test('HTTP 500 — JSON error with details', async ({page}) => {
        await setup500ServerErrorMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Internal server error');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('500');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot('error-500-json.png');
    });

    test('Network Error — shows error code and URL', async ({page}) => {
        await setupNetworkErrorMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText.toLowerCase()).toContain('network');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const errorCode = await errorDisplay.getDetailValue('Code');
        expect(errorCode).toBe('ERR_NETWORK');

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toBeTruthy();

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot('error-network.png');
    });

    test('HTTP 403 — shows AccessDenied without ResponseError details', async ({page}) => {
        await page.route(`${backend}/viewer/json/describe*`, async (route) => {
            await route.fulfill({status: 403});
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({schema: database, database, tenantPage: 'diagnostics'});

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForAccessDenied();

        const title = await errorDisplay.getAccessDeniedTitle();
        expect(title).toBe('Access denied');

        expect(await errorDisplay.isResponseErrorVisible()).toBe(false);

        await expect(errorDisplay.getAccessDeniedLocator()).toHaveScreenshot(
            'error-403-access-denied.png',
        );
    });

    test('HTTP 502 — x-proxy-name and x-trace-id fallback (no traceresponse)', async ({page}) => {
        await setup502WithProxyMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Bad Gateway');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('502');

        const traceId = await errorDisplay.getDetailValue('Trace-ID');
        expect(traceId).toContain('e2etest00112233');

        const proxyName = await errorDisplay.getDetailValue('x-proxy-name');
        expect(proxyName).toContain('test-proxy-node');

        const requestId = await errorDisplay.getDetailValue('Request-ID');
        expect(requestId).toContain('test-req-id-e2e-502');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-502-proxy.png',
        );
    });
});
