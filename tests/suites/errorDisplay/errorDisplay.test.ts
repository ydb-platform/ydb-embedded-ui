import {expect, test} from '@playwright/test';

import {backend, database} from '../../utils/constants';
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

const pageQueryParams = {
    schema: database,
    database,
    tenantPage: 'diagnostics',
};

test.describe('Error Display — ResponseError with Details', () => {
    test('HTTP 400 — plain text error with traceresponse and x-request-id', async ({page}) => {
        await setup400PlainTextMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const title = await errorDisplay.getPageErrorTitle();
        expect(title).toBe('Error');

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Cluster not found');

        expect(await errorDisplay.isDetailsButtonVisible()).toBe(true);
        await errorDisplay.expandDetails();

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('400');

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toBeTruthy();
        expect(url).toContain('/viewer/json/describe');

        const traceId = await errorDisplay.getDetailValue('traceresponse');
        expect(traceId).toBeTruthy();
        expect(traceId).toContain('aabbccdd11223344');

        const requestId = await errorDisplay.getDetailValue('x-request-id');
        expect(requestId).toBe('test-req-id-e2e-400');
    });

    test('HTTP 503 — empty body with x-worker-name', async ({page}) => {
        await setup503EmptyBodyMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Service Unavailable');

        expect(await errorDisplay.isDetailsButtonVisible()).toBe(true);
        await errorDisplay.expandDetails();

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('503');

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toBeTruthy();

        const workerName = await errorDisplay.getDetailValue('x-worker-name');
        expect(workerName).toContain('test-worker-node');
    });

    test('HTTP 429 — rate limit with issues', async ({page}) => {
        await setup429WithIssuesMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Throughput limit exceeded');

        expect(await errorDisplay.isDetailsButtonVisible()).toBe(true);
        await errorDisplay.expandDetails();

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('429');

        expect(await errorDisplay.isIssuesSectionVisible()).toBe(true);
        await errorDisplay.expandIssues();

        const issuesText = await errorDisplay.getIssuesText();
        expect(issuesText).toContain('Throughput limit exceeded');
    });

    test('HTTP 429 — HTML body without structured issues', async ({page}) => {
        await setup429HtmlMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('429 Too Many Requests');

        expect(await errorDisplay.isDetailsButtonVisible()).toBe(true);
        await errorDisplay.expandDetails();

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('429');

        expect(await errorDisplay.isIssuesSectionVisible()).toBe(false);
    });

    test('HTTP 500 — JSON error with details', async ({page}) => {
        await setup500ServerErrorMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Internal server error');

        expect(await errorDisplay.isDetailsButtonVisible()).toBe(true);
        await errorDisplay.expandDetails();

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('500');
    });

    test('Network Error — shows error code and URL', async ({page}) => {
        await setupNetworkErrorMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText.toLowerCase()).toContain('network');

        expect(await errorDisplay.isDetailsButtonVisible()).toBe(true);
        await errorDisplay.expandDetails();

        const errorCode = await errorDisplay.getDetailValue('Code');
        expect(errorCode).toBe('ERR_NETWORK');

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toBeTruthy();
    });

    test('HTTP 403 — shows AccessDenied without ResponseError details', async ({page}) => {
        await page.route(`${backend}/viewer/json/describe*`, async (route) => {
            await route.fulfill({status: 403});
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForAccessDenied();

        const title = await errorDisplay.getAccessDeniedTitle();
        expect(title).toBe('Access denied');

        expect(await errorDisplay.isResponseErrorVisible()).toBe(false);
    });

    test('HTTP 502 — x-proxy-name and x-trace-id fallback (no traceresponse)', async ({page}) => {
        await setup502WithProxyMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Bad Gateway');

        expect(await errorDisplay.isDetailsButtonVisible()).toBe(true);
        await errorDisplay.expandDetails();

        const status = await errorDisplay.getDetailValue('Status');
        expect(status).toContain('502');

        const traceId = await errorDisplay.getDetailValue('traceresponse');
        expect(traceId).toContain('e2etest00112233');

        const proxyName = await errorDisplay.getDetailValue('x-proxy-name');
        expect(proxyName).toContain('test-proxy-node');

        const requestId = await errorDisplay.getDetailValue('x-request-id');
        expect(requestId).toContain('test-req-id-e2e-502');
    });
});
