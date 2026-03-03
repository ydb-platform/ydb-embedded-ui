import {chromium} from '@playwright/test';

import config from '../playwright.config';

import {PageModel} from './models/PageModel';
import {backend} from './utils/constants';

const baseURL = (config.use?.baseURL || 'http://localhost:3000/').replace(/\/?$/, '/');

const WARMUP_PAGES = [
    // Cluster overview (tenants list)
    'cluster/tenants',
    // Nodes page
    'cluster/nodes',
    // Storage page
    'cluster/storage',
    // Tenant diagnostics
    'tenant?schema=/local&database=/local&tenantPage=diagnostics',
    // Query editor (triggers Monaco Editor lazy load + YDB query session init)
    'tenant?schema=/local&database=/local&tenantPage=query',
];

const BACKEND_READINESS_TIMEOUT = 60_000;
const BACKEND_READINESS_INTERVAL = 2_000;

async function waitForBackend() {
    const healthUrl = `${backend}/viewer/json/healthcheck`;
    const start = Date.now();

    while (Date.now() - start < BACKEND_READINESS_TIMEOUT) {
        try {
            const response = await fetch(healthUrl, {signal: AbortSignal.timeout(5_000)});
            if (response.ok) {
                return;
            }
        } catch {
            // Backend not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, BACKEND_READINESS_INTERVAL));
    }

    throw new Error(
        `Backend did not become ready within ${BACKEND_READINESS_TIMEOUT / 1000}s at ${healthUrl}`,
    );
}

async function waitForPageReady(page: PageModel) {
    try {
        await page.page.waitForLoadState('networkidle', {timeout: 15000});
    } catch {
        // networkidle may not fire if there are persistent connections, continue anyway
    }
}

async function warmupApplication(page: PageModel) {
    const maxRetries = 5;
    const retryDelay = 2000;

    // Initial warmup: wait for app to be available
    for (let i = 0; i < maxRetries; i++) {
        try {
            await page.goto();
            await page.page.waitForLoadState('networkidle');
            await page.page.waitForTimeout(retryDelay);
            break;
        } catch {
            if (i === maxRetries - 1) {
                throw new Error('Application warmup failed after max retries');
            }
        }
    }

    // Visit key pages to warm up backend caches and lazy-loaded UI
    for (const path of WARMUP_PAGES) {
        try {
            await page.page.goto(`${baseURL}${path}`);
            await waitForPageReady(page);
        } catch {
            // Non-critical: some pages may not load if backend is slow, continue
        }
    }

    // Execute a simple query to warm up KQP compile cache and query session
    try {
        await page.page.goto(`${baseURL}tenant?schema=/local&database=/local&tenantPage=query`);
        await waitForPageReady(page);

        // Wait for Monaco editor to load
        await page.page.waitForSelector('.query-editor__monaco .monaco-editor', {timeout: 15000});

        // Type and execute a simple query
        const textarea = page.page.locator('.query-editor__monaco textarea');
        await textarea.fill('SELECT 1;');

        const runButton = page.page.locator('.query-editor').getByRole('button', {name: 'Run'});
        await runButton.click();

        // Wait for execution to complete
        await page.page.waitForSelector('.kv-query-execution-status .g-text', {timeout: 15000});
    } catch {
        // Non-critical: query warmup failure doesn't block tests
    }
}

export default async function globalSetup() {
    await waitForBackend();

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const appPage = new PageModel(page, baseURL);
    await warmupApplication(appPage);
    await browser.close();
}
