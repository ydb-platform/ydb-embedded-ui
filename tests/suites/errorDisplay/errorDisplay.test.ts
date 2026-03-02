import {expect, test} from '@playwright/test';

import {backend, database} from '../../utils/constants';
import {ClusterPage} from '../cluster/ClusterPage';
import {TenantPage} from '../tenant/TenantPage';

import {ErrorDisplayModel} from './ErrorDisplayModel';
import {
    setup400PlainTextMock,
    setup401CapabilitiesNoAuthUrlMock,
    setup429HtmlMock,
    setup429WithIssuesMock,
    setup500ServerErrorMock,
    setup502WithProxyMock,
    setup503EmptyBodyMock,
    setupNetworkErrorMock,
    setupWhoami500Mock,
    setupWhoami503TextBodyMock,
    setupWhoamiNetworkErrorMock,
} from './errorDisplayMocks';

const FULL_PAGE_DIR = 'playwright-artifacts/full-page-screenshots';

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
        await page.screenshot({path: `${FULL_PAGE_DIR}/full-400-plain-text.png`, fullPage: true});
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

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toBeTruthy();

        const workerName = await errorDisplay.getDetailValue('x-worker-name');
        expect(workerName).toContain('test-worker-node');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-503-empty-body.png',
        );
        await page.screenshot({path: `${FULL_PAGE_DIR}/full-503-empty-body.png`, fullPage: true});
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

        expect(await errorDisplay.isIssuesTriggerVisible()).toBe(true);
        await errorDisplay.expandIssues();

        const issuesText = await errorDisplay.getIssuesText();
        expect(issuesText).toContain('Throughput limit exceeded');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-429-with-issues.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-429-with-issues.png`,
            fullPage: true,
        });
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

        expect(await errorDisplay.isIssuesTriggerVisible()).toBe(false);

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-429-html-body.png',
        );
        await page.screenshot({path: `${FULL_PAGE_DIR}/full-429-html-body.png`, fullPage: true});
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

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot('error-500-json.png');
        await page.screenshot({path: `${FULL_PAGE_DIR}/full-500-json.png`, fullPage: true});
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
        await page.screenshot({path: `${FULL_PAGE_DIR}/full-network-error.png`, fullPage: true});
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
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-403-access-denied.png`,
            fullPage: true,
        });
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

        const traceId = await errorDisplay.getDetailValue('Trace-ID');
        expect(traceId).toContain('e2etest00112233');

        const proxyName = await errorDisplay.getDetailValue('x-proxy-name');
        expect(proxyName).toContain('test-proxy-node');

        const requestId = await errorDisplay.getDetailValue('Request-ID');
        expect(requestId).toContain('test-req-id-e2e-502');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-502-proxy.png',
        );
        await page.screenshot({path: `${FULL_PAGE_DIR}/full-502-proxy.png`, fullPage: true});
    });

    test('Full-page error — whoami 500 blocks entire page with details', async ({page}) => {
        await setupWhoami500Mock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const bodyText = await errorDisplay.getPageErrorBodyText();
        expect(bodyText).toContain('500');

        expect(await errorDisplay.isPageErrorFieldsVisible()).toBe(true);

        const url = await errorDisplay.getPageErrorDetailValue('URL');
        expect(url).toBeTruthy();
        expect(url).toContain('/viewer/json/whoami');

        const traceId = await errorDisplay.getPageErrorDetailValue('Trace-ID');
        expect(traceId).toBeTruthy();
        expect(traceId).toContain('whoamitrace1122334455667788');

        const requestId = await errorDisplay.getPageErrorDetailValue('Request-ID');
        expect(requestId).toBe('test-req-id-e2e-whoami-500');

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-500.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-whoami-500.png`,
            fullPage: true,
        });
    });

    test('Full-page error — whoami 503 with text body and x-worker-name', async ({page}) => {
        await setupWhoami503TextBodyMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const bodyText = await errorDisplay.getPageErrorBodyText();
        expect(bodyText).toContain('Database connection pool exhausted');

        expect(await errorDisplay.isPageErrorFieldsVisible()).toBe(true);

        const workerName = await errorDisplay.getPageErrorDetailValue('x-worker-name');
        expect(workerName).toContain('auth-worker-03');

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-503-text.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-whoami-503-text.png`,
            fullPage: true,
        });
    });

    test('Full-page error — whoami network error (no status)', async ({page}) => {
        await setupWhoamiNetworkErrorMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const bodyText = await errorDisplay.getPageErrorBodyText();
        expect(bodyText.toLowerCase()).toContain('network');

        expect(await errorDisplay.isPageErrorFieldsVisible()).toBe(true);

        const errorCode = await errorDisplay.getPageErrorDetailValue('Code');
        expect(errorCode).toBe('ERR_NETWORK');

        const url = await errorDisplay.getPageErrorDetailValue('URL');
        expect(url).toBeTruthy();
        expect(url).toContain('/viewer/json/whoami');

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-network.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-whoami-network.png`,
            fullPage: true,
        });
    });

    test('HTTP 401 — capabilities without authUrl shows AccessDenied', async ({page}) => {
        await setup401CapabilitiesNoAuthUrlMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForAccessDenied();

        const title = await errorDisplay.getAccessDeniedTitle();
        expect(title).toBe('Access denied');

        expect(await errorDisplay.isResponseErrorVisible()).toBe(false);

        await expect(errorDisplay.getAccessDeniedLocator()).toHaveScreenshot(
            'error-401-capabilities-access-denied.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-401-capabilities-access-denied.png`,
            fullPage: true,
        });
    });
});
