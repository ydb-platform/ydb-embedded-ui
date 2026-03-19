import {expect, test} from '@playwright/test';

import {database} from '../../utils/constants';
import {
    cleanupMockStreamingFetch,
    setupMockStreamingNonJsonChunk,
} from '../../utils/mockStreamingFetch';
import {toggleExperiment} from '../../utils/toggleExperiment';
import {ClusterPage} from '../cluster/ClusterPage';
import {TenantPage} from '../tenant/TenantPage';
import {QueryEditor} from '../tenant/queryEditor/models/QueryEditor';

import {ErrorDisplayModel} from './ErrorDisplayModel';
import {
    setupCapabilities401Mock,
    setupCluster400PlainTextMock,
    setupDescribe403Mock,
    setupNodeNetworkErrorMock,
    setupPDisk503EmptyBodyMock,
    setupQueryResult500Mock,
    setupQueryResultNetworkErrorMock,
    setupStorageGroup429HtmlMock,
    setupStreamingQuery500Mock,
    setupStreamingQueryMidStreamErrorMock,
    setupStreamingQueryNetworkErrorMock,
    setupTablet400JsonCodeOnlyMock,
    setupVDisk429WithIssuesMock,
    setupWhoami401NeedResetMock,
    setupWhoami500Mock,
    setupWhoami502HtmlMock,
    setupWhoami503TextMock,
    setupWhoamiHybridNetworkErrorMock,
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
//   Full-page: Whoami → 502 HTML body + x-proxy-name + x-trace-id
//   Full-page: Whoami → 503 text body + x-worker-name
//   Full-page: Whoami → hybrid ERR_NETWORK + nested 404/headers
//   Full-page: Whoami → network error (ERR_NETWORK)
//   Access:    Tenant → 403 AccessDenied
//   Access:    Capabilities → 401 Unauthenticated

test.describe('Error Display — ResponseError and PageError across pages', () => {
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

        expect(await errorDisplay.isResponseBodyTriggerVisible()).toBe(true);
        await errorDisplay.expandResponseBody();

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

        expect(await errorDisplay.isResponseBodyTriggerVisible()).toBe(true);
        await errorDisplay.expandResponseBody();

        const responseBody = await errorDisplay.getResponseBodyText();
        expect(responseBody).toContain('Rate limit exceeded');

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
        expect(errorText).toContain('NOT_FOUND');

        expect(await errorDisplay.isResponseBodyTriggerVisible()).toBe(true);
        await errorDisplay.expandResponseBody();

        const responseBody = await errorDisplay.getResponseBodyText();
        expect(responseBody).toContain('NOT_FOUND');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-tablet-400-code-only.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-tablet-400-code-only.png`,
            fullPage: true,
        });
    });

    // --- Toggle button label and expand/collapse behavior ---

    test('StorageGroup — toggle button says "Response" and expands/collapses response body', async ({
        page,
    }) => {
        await setupStorageGroup429HtmlMock(page);

        await page.goto('storageGroup?groupId=1');

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        // Button should be labeled "Response"
        const buttonText = await errorDisplay.getToggleButtonText();
        expect(buttonText).toContain('Response');

        // Content should not be visible initially
        expect(await errorDisplay.isResponseBodyContentVisible()).toBe(false);

        // Click to expand
        await errorDisplay.clickToggleButton();
        expect(await errorDisplay.isResponseBodyContentVisible()).toBe(true);

        const responseBody = await errorDisplay.getResponseBodyText();
        expect(responseBody).toContain('Rate limit exceeded');

        // Click to collapse
        await errorDisplay.clickToggleButton();
        await errorDisplay.waitForResponseBodyContentHidden();
        expect(await errorDisplay.isResponseBodyContentVisible()).toBe(false);
    });

    test('VDisk — toggle button says "Issues" and expands/collapses issues', async ({page}) => {
        await setupVDisk429WithIssuesMock(page);

        await page.goto('vDisk?nodeId=1&vDiskId=1-0-0-0-0');

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        // Button should be labeled "Issues"
        const buttonText = await errorDisplay.getToggleButtonText();
        expect(buttonText).toContain('Issues');

        // Issues content should not be visible initially
        expect(await errorDisplay.isIssuesContentVisible()).toBe(false);

        // Click to expand
        await errorDisplay.clickToggleButton();

        // Expand the issues trigger inside the expanded section
        expect(await errorDisplay.isIssuesTriggerVisible()).toBe(true);
        await errorDisplay.expandIssues();
        expect(await errorDisplay.isIssuesContentVisible()).toBe(true);

        // Click toggle button to collapse the entire section
        await errorDisplay.clickToggleButton();
        await errorDisplay.waitForIssuesContentHidden();
        expect(await errorDisplay.isIssuesContentVisible()).toBe(false);
    });

    // --- Full-page PageError ---

    test('Full-page — whoami 500 blocks entire page with trace headers', async ({page}) => {
        await setupWhoami500Mock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        // errorPageTitle is passed via GetUserWrapper as appTitle ("YDB Monitoring")
        // and should be rendered as pageTitle in EmptyState
        expect(await errorDisplay.isPageErrorPageTitleVisible()).toBe(true);
        const pageTitle = await errorDisplay.getPageErrorPageTitle();
        expect(pageTitle).toBe('YDB Monitoring');

        const bodyText = await errorDisplay.getPageErrorBodyText();
        expect(bodyText).toContain('500');

        expect(await errorDisplay.isPageErrorFieldsVisible()).toBe(true);

        const url = await errorDisplay.getPageErrorDetailValue('URL');
        expect(url).toContain('/viewer/json/whoami');

        const traceId = await errorDisplay.getPageErrorDetailValue('Trace-ID');
        expect(traceId).toContain('whoamitrace1122334455667788');

        const requestId = await errorDisplay.getPageErrorDetailValue('Request-ID');
        expect(requestId).toBe('test-req-id-e2e-whoami-500');

        expect(await errorDisplay.isPageErrorResponseBodyTriggerVisible()).toBe(true);
        await errorDisplay.expandPageErrorResponseBody();

        const responseBody = await errorDisplay.getPageErrorResponseBodyText();
        expect(responseBody).toContain('Authentication service unavailable');

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-500.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-whoami-500.png`,
            fullPage: true,
        });
    });

    test('Full-page — whoami 500 collapsed vs expanded details', async ({page}) => {
        await setupWhoami500Mock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-500-collapsed.png',
        );

        await errorDisplay.expandPageErrorResponseBody();

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-500-expanded.png',
        );
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

    test('Full-page — whoami hybrid network error restores 404 and response headers', async ({
        page,
    }) => {
        await setupWhoamiHybridNetworkErrorMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const title = await errorDisplay.getPageErrorTitle();
        expect(title).toContain('404');
        expect(title).toContain('Not Found');

        const bodyText = await errorDisplay.getPageErrorBodyText();
        expect(bodyText).toContain('Network Error');

        expect(await errorDisplay.isPageErrorFieldsVisible()).toBe(true);

        const errorCode = await errorDisplay.getPageErrorDetailValue('Code');
        expect(errorCode).toBe('ERR_NETWORK');

        const url = await errorDisplay.getPageErrorDetailValue('URL');
        expect(url).toContain('/api/meta3/proxy/cluster/test-cluster/viewer/json/whoami');
        expect(url).toContain('database=3');

        const traceId = await errorDisplay.getPageErrorDetailValue('Trace-ID');
        expect(traceId).toBe('11112222333344445555666677778888');

        const requestId = await errorDisplay.getPageErrorDetailValue('Request-ID');
        expect(requestId).toBe('test-request-id-404-hybrid');

        const proxyName = await errorDisplay.getPageErrorDetailValue('x-proxy-name');
        expect(proxyName).toBe('https://test-proxy-node.example.test:443');

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-hybrid-network.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-whoami-hybrid-network.png`,
            fullPage: true,
        });
    });

    test('Full-page — whoami 502 HTML body with x-proxy-name', async ({page}) => {
        await setupWhoami502HtmlMock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForPageError();

        const title = await errorDisplay.getPageErrorTitle();
        expect(title).toContain('502');

        expect(await errorDisplay.isPageErrorFieldsVisible()).toBe(true);

        const proxyName = await errorDisplay.getPageErrorDetailValue('x-proxy-name');
        expect(proxyName).toContain('auth-proxy-01');

        const traceId = await errorDisplay.getPageErrorDetailValue('Trace-ID');
        expect(traceId).toContain('htmltrace0011223344556677');

        expect(await errorDisplay.isPageErrorResponseBodyTriggerVisible()).toBe(true);
        await errorDisplay.expandPageErrorResponseBody();

        const responseBody = await errorDisplay.getPageErrorResponseBodyText();
        expect(responseBody).toContain('upstream server returned an invalid response');

        await expect(errorDisplay.getPageErrorLocator()).toHaveScreenshot(
            'error-full-page-whoami-502-html.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-whoami-502-html.png`,
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

    test('Cluster — 401 capabilities shows Unauthenticated', async ({page}) => {
        await setupCapabilities401Mock(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForAccessDenied();

        const title = await errorDisplay.getAccessDeniedTitle();
        expect(title).toBe('Authentication required');

        expect(await errorDisplay.isResponseErrorVisible()).toBe(false);

        await expect(errorDisplay.getAccessDeniedLocator()).toHaveScreenshot(
            'error-cluster-401-capabilities.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-cluster-401-capabilities.png`,
            fullPage: true,
        });
    });
    test('Cluster — 401 whoami with NEED_RESET causes page to reload', async ({page}) => {
        await setupWhoami401NeedResetMock(page);

        let whoamiCalls = 0;
        let whoamiCalls200 = 0;
        let whoamiCalls401 = 0;

        page.on('response', (resp) => {
            if (resp.url().includes('/viewer/json/whoami')) {
                whoamiCalls++;

                if (resp.status() === 200) {
                    whoamiCalls200++;
                }
                if (resp.status() === 401) {
                    whoamiCalls401++;
                }
            }
        });

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();
        await page.waitForLoadState('networkidle');

        expect(whoamiCalls).toBe(2);
        expect(whoamiCalls200).toBe(1);
        expect(whoamiCalls401).toBe(1);

        expect(await clusterPage.isClusterInfoVisible()).toBe(true);
    });

    // --- Query result errors (non-streaming, ResponseError in query result pane) ---
    // Streaming is disabled to force the non-streaming (axios) path,
    // which preserves error details (response body, headers, URL).

    test('Query result — 500 with trace headers shows ResponseError with details', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({schema: database, database, tenantPage: 'query'});

        await toggleExperiment(page, 'off', 'Query Streaming');
        await setupQueryResult500Mock(page);

        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Query execution failed');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const traceId = await errorDisplay.getDetailValue('Trace-ID');
        expect(traceId).toContain('querytr00112233');

        const requestId = await errorDisplay.getDetailValue('Request-ID');
        expect(requestId).toBe('test-req-id-e2e-query-500');

        const workerName = await errorDisplay.getDetailValue('x-worker-name');
        expect(workerName).toContain('query-worker-01');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-query-result-500.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-query-result-500.png`,
            fullPage: true,
        });
    });

    test('Query result — network error shows ResponseError', async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({schema: database, database, tenantPage: 'query'});

        await toggleExperiment(page, 'off', 'Query Streaming');
        await setupQueryResultNetworkErrorMock(page);

        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText.toLowerCase()).toContain('network');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-query-result-network.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-query-result-network.png`,
            fullPage: true,
        });
    });

    // --- Streaming query result errors ---
    // Streaming stays ON (default). Only the streaming endpoint (/viewer/query) is mocked.

    test('Streaming query — 500 with trace headers shows ResponseError with details', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({schema: database, database, tenantPage: 'query'});

        await setupStreamingQuery500Mock(page);

        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        expect(errorText).toContain('Query execution failed');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const traceId = await errorDisplay.getDetailValue('Trace-ID');
        expect(traceId).toContain('streamtr0011223344');

        const requestId = await errorDisplay.getDetailValue('Request-ID');
        expect(requestId).toBe('test-req-id-e2e-stream-500');

        const workerName = await errorDisplay.getDetailValue('x-worker-name');
        expect(workerName).toContain('stream-worker-02');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-streaming-query-500.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-streaming-query-500.png`,
            fullPage: true,
        });
    });

    test('Streaming query — mid-stream network error preserves headers from initial response', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({schema: database, database, tenantPage: 'query'});

        const cleanup = await setupStreamingQueryMidStreamErrorMock(page);

        try {
            const queryEditor = new QueryEditor(page);
            await queryEditor.setQuery('SELECT 1;');
            await queryEditor.clickRunButton();

            const errorDisplay = new ErrorDisplayModel(page);
            await errorDisplay.waitForResponseError();

            expect(await errorDisplay.isFieldsVisible()).toBe(true);

            // Headers from the initial HTTP 200 response are preserved
            // even though the connection was dropped mid-stream
            const traceId = await errorDisplay.getDetailValue('Trace-ID');
            expect(traceId).toContain('midstreamtrace1122334455');

            const workerName = await errorDisplay.getDetailValue('x-worker-name');
            expect(workerName).toContain('stream-worker-midstream');

            const url = await errorDisplay.getDetailValue('URL');
            expect(url).toContain('/viewer/query');

            await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
                'error-streaming-query-midstream.png',
            );
            await page.screenshot({
                path: `${FULL_PAGE_DIR}/full-streaming-query-midstream.png`,
                fullPage: true,
            });
        } finally {
            await cleanup();
        }
    });

    test('Streaming query — pre-connection network error shows URL from enriched error', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({schema: database, database, tenantPage: 'query'});

        await setupStreamingQueryNetworkErrorMock(page);

        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        const errorDisplay = new ErrorDisplayModel(page);
        await errorDisplay.waitForResponseError();

        const errorText = await errorDisplay.getResponseErrorText();
        // Chrome: "Failed to fetch", Safari: "Load failed"
        expect(errorText.toLowerCase()).toContain('failed');

        expect(await errorDisplay.isFieldsVisible()).toBe(true);

        const url = await errorDisplay.getDetailValue('URL');
        expect(url).toContain('/viewer/query');

        await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
            'error-streaming-query-network.png',
        );
        await page.screenshot({
            path: `${FULL_PAGE_DIR}/full-streaming-query-network.png`,
            fullPage: true,
        });
    });

    test('Streaming query — non-JSON chunk shows parse error with raw text preview', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({schema: database, database, tenantPage: 'query'});

        await setupMockStreamingNonJsonChunk(page);

        try {
            const queryEditor = new QueryEditor(page);
            await queryEditor.setQuery('SELECT 1;');
            await queryEditor.clickRunButton();

            const errorDisplay = new ErrorDisplayModel(page);
            await errorDisplay.waitForResponseError();

            const errorText = await errorDisplay.getResponseErrorText();
            expect(errorText).toContain('Error parsing chunk');
            expect(errorText).toContain('504 Gateway Timeout');

            expect(await errorDisplay.isFieldsVisible()).toBe(true);

            const workerName = await errorDisplay.getDetailValue('x-worker-name');
            expect(workerName).toContain('stream-worker-parse-error');

            const url = await errorDisplay.getDetailValue('URL');
            expect(url).toContain('/viewer/query');

            await expect(errorDisplay.getResponseErrorLocator()).toHaveScreenshot(
                'error-streaming-query-non-json-chunk.png',
            );
            await page.screenshot({
                path: `${FULL_PAGE_DIR}/full-streaming-query-non-json-chunk.png`,
                fullPage: true,
            });
        } finally {
            await cleanupMockStreamingFetch(page);
        }
    });
});
