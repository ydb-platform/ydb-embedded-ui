import {chromium} from '@playwright/test';

import config from '../playwright.config';

import {PageModel} from './models/PageModel';

const baseURL = (config.use?.baseURL || 'http://localhost:3000/').replace(/\/?$/, '/');

const WARMUP_PAGES = [
    // Cluster overview (databases list)
    {name: 'cluster databases', path: 'cluster/databases'},
    // Nodes page
    {name: 'cluster nodes', path: 'cluster/nodes'},
    // Storage page
    {name: 'cluster storage', path: 'cluster/storage'},
    // Database diagnostics
    {
        name: 'database diagnostics',
        path: 'database?schema=/local&database=/local&databasePage=diagnostics',
    },
];

async function measureWarmupPhase(name: string, action: () => Promise<void>) {
    const startedAt = Date.now();

    try {
        await action();
    } finally {
        console.info(`[playwright warmup] ${name}: ${Date.now() - startedAt}ms`);
    }
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

    // Initial warmup: wait for app to be available
    await measureWarmupPhase('initial navigation', async () => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await page.goto();
                await page.page.waitForLoadState('networkidle');
                break;
            } catch {
                if (i === maxRetries - 1) {
                    throw new Error('Application warmup failed after max retries');
                }
            }
        }
    });

    // Visit key pages to warm up backend caches and lazy-loaded UI
    for (const {name, path} of WARMUP_PAGES) {
        try {
            await measureWarmupPhase(name, async () => {
                await page.page.goto(`${baseURL}${path}`);
                await waitForPageReady(page);
            });
        } catch {
            // Non-critical: some pages may not load if backend is slow, continue
        }
    }

    // Execute a simple query to warm up KQP compile cache and query session
    try {
        await measureWarmupPhase('query editor and SELECT 1', async () => {
            await page.page.goto(
                `${baseURL}database?schema=/local&database=/local&databasePage=query`,
            );
            await waitForPageReady(page);

            // Wait for Monaco editor to load
            await page.page.waitForSelector('.query-editor__monaco .monaco-editor', {
                timeout: 15000,
            });

            // Type and execute a simple query
            const textarea = page.page.locator('.query-editor__monaco textarea');
            await textarea.fill('SELECT 1;');

            const runButton = page.page.locator('.query-editor').getByRole('button', {name: 'Run'});
            await runButton.click();

            // Wait for execution to complete
            await page.page.waitForSelector(
                '[data-qa="ydb-query-execution-status"] .g-label__content',
                {timeout: 15000},
            );
        });
    } catch {
        // Non-critical: query warmup failure doesn't block tests
    }
}

export default async function globalSetup() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const appPage = new PageModel(page, baseURL);
    await warmupApplication(appPage);
    await browser.close();
}
