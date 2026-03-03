import {expect, test} from '@playwright/test';

import {database} from '../../utils/constants';
import {ClusterPage} from '../cluster/ClusterPage';
import {TenantPage} from '../tenant/TenantPage';

import {ErrorDisplayModel} from './ErrorDisplayModel';
import {
    setupCapabilities401Mock,
    setupCluster400PlainTextMock,
    setupDescribe403Mock,
    setupNodeNetworkErrorMock,
    setupPDisk503EmptyBodyMock,
    setupStorageGroup429HtmlMock,
    setupTablet400JsonCodeOnlyMock,
    setupVDisk429WithIssuesMock,
    setupWhoami500Mock,
    setupWhoami503TextMock,
    setupWhoamiNetworkErrorMock,
} from './errorDisplayMocks';

const FULL_PAGE_DIR = 'playwright-artifacts/full-page-screenshots';

// Each test covers a unique (page × error-type) combination:
//   Inline:    Cluster → 400 plain text + trace headers
//   Inline:    Node → network error (ERR_NETWORK)
//   Inline:    PDisk → 503 empty body + x-worker-name
//   Inline:    VDisk → 429 JSON with issues
//   Inline:    StorageGroup → 429 HTML body + x-proxy-name + x-trace-id
//   Inline:    Tablet → 400 JSON with only code field
//   Full-page: Whoami → 500 JSON + trace headers
//   Full-page: Whoami → 503 text body + x-worker-name
//   Full-page: Whoami → network error (ERR_NETWORK)
//   Access:    Tenant → 403 AccessDenied
//   Access:    Capabilities → 401 AccessDenied

test.describe.only('Error Display — ResponseError and PageError across pages', () => {
    // --- Inline ResponseError (one per navigable page, each a different error type) ---

    test('Cluster — 400 plain text with traceresponse and x-request-id', async ({page}) => {
        await setupCluster400PlainTextMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Cluster not found');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toContain('/viewer/json/cluster');

        const traceId = await errorDisplay.getDetailValue('Trace-ID');
        expect(traceId).toContain('aabbccdd11223344');

        const requestId = await errorDisplay.getDetailValue('Request-ID');
        expect(requestId).toBe('test-req-id-e2e-400');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-cluster-400-plain-text.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-cluster-400-plain-text.png`,
            fullPage: true,
        });
    });

    test('Node — network error shows ERR_NETWORK code', async ({page}) => {
        await setupNodeNetworkErrorMock(page);

        await page.goto('node/1');

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText.toLowerCase()).toContain('network');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const errorCode = await errorDisplay.getDetailValue('Code');
        expect(errorCode).toBe('ERR_NETWORK');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-node-network.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-node-network.png`,
            fullPage: true,
        });
    });

    test('PDisk — 503 empty body with x-worker-name', async ({page}) => {
        await setupPDisk503EmptyBodyMock(page);

        await page.goto('pDisk?nodeId=1&pDiskId=1');

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Service Unavailable');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const workerName = await errorDisplay.getDetailValue('x-worker-name');
        expect(workerName).toContain('test-worker-node');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-pdisk-503-empty.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-pdisk-503-empty.png`,
            fullPage: true,
        });
    });

    test('VDisk — 429 JSON with expandable issues', async ({page}) => {
        await setupVDisk429WithIssuesMock(page);

        await page.goto('vDisk?nodeId=1&vDiskId=1-0-0-0-0');

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Throughput limit exceeded');

        expect(await errorDisplay.isIssuesTriggerVisible()).toBe(true);
        await errorDisplay.expandIssues();

        const issuesText = await errorDisplay.getIssuesText();
        expect(issuesText).toContain('Throughput limit exceeded');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-vdisk-429-issues.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-vdisk-429-issues.png`,
            fullPage: true,
        });
    });

    test('StorageGroup — 429 HTML body with x-proxy-name and x-trace-id', async ({page}) => {
        await setupStorageGroup429HtmlMock(page);

        await page.goto('storageGroup?groupId=1');

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('429 Too Many Requests');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const traceId = await errorDisplay.getDetailValue('Trace-ID');
        expect(traceId).toContain('e2etest00112233');

        const proxyName = await errorDisplay.getDetailValue('x-proxy-name');
        expect(proxyName).toContain('test-proxy-node');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-storage-group-429-html.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-storage-group-429-html.png`,
            fullPage: true,
        });
    });

    test('Tablet — 400 JSON with only code field shows code as message', async ({page}) => {
        await setupTablet400JsonCodeOnlyMock(page);

        await page.goto('tablet/1');

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('NEED_RESET');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-tablet-400-code-only.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-tablet-400-code-only.png`,
            fullPage: true,
        });
    });

    // --- Full-page PageError ---

    test('Full-page — whoami 500 blocks entire page with trace headers', async ({page}) => {
        await setupWhoami500Mock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const bodyText = await errorDisplay.getPageErrorBodyText();
        expect(bodyText).toContain('500');

        expect(await errorDisplay.isPageErrorFieldsVisible()).toBe(true);

        const url = await errorDisplay.getPageErrorDetailValue('URL');
        expect(url).toContain('/viewer/json/whoami');

        const traceId = await errorDisplay.getPageErrorDetailValue('Trace-ID');
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

    test('Full-page — whoami 503 text body with x-worker-name', async ({page}) => {
        await setupWhoami503TextMock(page);

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

    test('Full-page — whoami network error blocks entire page', async ({page}) => {
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
        expect(url).toContain('/viewer/json/whoami');

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-network.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-whoami-network.png`,
            fullPage: true,
        });
    });

    // --- AccessDenied ---

    test('Tenant — 403 describe shows AccessDenied', async ({page}) => {
        await setupDescribe403Mock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({schema: database, database, tenantPage: 'diagnostics'});

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForAccessDenied();

        const title = await errorDisplay.getAccessDeniedTitle();
        expect(title).toBe('Access denied');

        expect(await errorDisplay.isResponseErrorVisible()).toBe(false);

        await expect(errorDisplay.getAccessDeniedLocator()).toHaveScreenshot(
            'error-tenant-403-access-denied.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-tenant-403-access-denied.png`,
            fullPage: true,
        });
    });

    test('Cluster — 401 capabilities shows AccessDenied', async ({page}) => {
        await setupCapabilities401Mock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForAccessDenied();

        const title = await errorDisplay.getAccessDeniedTitle();
        expect(title).toBe('Access denied');

        expect(await errorDisplay.isResponseErrorVisible()).toBe(false);

        await expect(errorDisplay.getAccessDeniedLocator()).toHaveScreenshot(
            'error-cluster-401-capabilities.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-cluster-401-capabilities.png`,
            fullPage: true,
        });
    });
});
