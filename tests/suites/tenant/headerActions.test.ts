import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {TenantPage} from './TenantPage';

const serverlessDatabase = {
    Id: 'serverless-id',
    Name: '/local/serverless',
    Type: 'Serverless',
    State: 'RUNNING',
    Overall: 'Green',
    ResourceId: '42',
    NodeIds: [],
};

const sharedDatabase = {
    Id: '42',
    Name: '/local/shared',
    Type: 'Shared',
    State: 'RUNNING',
    Overall: 'Green',
    NodeIds: [1],
};

interface SharedDatabaseRequestLog {
    describeByPathId: Array<{
        database: string | null;
        pathId: string | null;
    }>;
    tenantList: Array<{
        metadataCache: string | null;
        storage: string | null;
        tablets: string | null;
    }>;
}

async function setupDatabaseMocks(
    page: Page,
    {
        describeResult = 'success',
        isMonitoringAllowed,
    }: {describeResult?: 'error' | 'success'; isMonitoringAllowed: boolean},
) {
    const requestLog: SharedDatabaseRequestLog = {
        describeByPathId: [],
        tenantList: [],
    };

    await page.route('**/viewer/capabilities?*', async (route) => {
        await route.fulfill({json: {Capabilities: {}}});
    });
    await page.route('**/viewer/json/whoami?*', async (route) => {
        await route.fulfill({
            json: {
                UserSID: 'test-user',
                IsViewerAllowed: true,
                IsMonitoringAllowed: isMonitoringAllowed,
                IsAdministrationAllowed: false,
            },
        });
    });
    await page.route('**/viewer/json/describe?*', async (route) => {
        const url = new URL(route.request().url());

        if (url.searchParams.get('path_id') === serverlessDatabase.ResourceId) {
            requestLog.describeByPathId.push({
                database: url.searchParams.get('database'),
                pathId: url.searchParams.get('path_id'),
            });
            if (describeResult === 'error') {
                await route.fulfill({status: 403, json: {error: 'Forbidden'}});
                return;
            }
            await route.fulfill({json: {Path: sharedDatabase.Name}});
            return;
        }

        await route.fulfill({json: {Path: serverlessDatabase.Name}});
    });
    await page.route('**/viewer/json/tenantinfo?*', async (route) => {
        const url = new URL(route.request().url());
        const requestedDatabase = url.searchParams.get('database');

        if (requestedDatabase === sharedDatabase.Name) {
            await route.fulfill({json: {TenantInfo: [sharedDatabase]}});
            return;
        }
        if (requestedDatabase === serverlessDatabase.Name) {
            await route.fulfill({json: {TenantInfo: [serverlessDatabase]}});
            return;
        }

        requestLog.tenantList.push({
            metadataCache: url.searchParams.get('metadata_cache'),
            storage: url.searchParams.get('storage'),
            tablets: url.searchParams.get('tablets'),
        });
        await route.fulfill({json: {TenantInfo: [serverlessDatabase, sharedDatabase]}});
    });

    return requestLog;
}

async function openServerlessDatabaseMenu(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('enableTenantNavigationV2', JSON.stringify(true));
    });

    const tenantPage = new TenantPage(page);
    await tenantPage.goto({
        schema: serverlessDatabase.Name,
        database: serverlessDatabase.Name,
        databasePage: 'diagnostics',
    });

    const actionsMenu = page.locator('.header__actions-menu');
    await actionsMenu.getByRole('button').click();
    const sharedDatabaseMenuItem = page.getByRole('menuitem', {
        name: 'Go to shared database',
        exact: true,
    });
    await expect(sharedDatabaseMenuItem).toBeVisible();

    const href = await sharedDatabaseMenuItem.getAttribute('href');
    if (!href) {
        throw new Error('Shared database menu item must have an href');
    }
    expect(new URL(href, page.url()).searchParams.get('database')).toBe(sharedDatabase.Name);
}

test.describe('Database header actions', () => {
    test('resolves the shared database with describe for a monitoring user', async ({page}) => {
        const requestLog = await setupDatabaseMocks(page, {isMonitoringAllowed: true});

        await openServerlessDatabaseMenu(page);

        expect(requestLog).toEqual({
            describeByPathId: [
                {
                    database: serverlessDatabase.Name,
                    pathId: serverlessDatabase.ResourceId,
                },
            ],
            tenantList: [],
        });
    });

    test('uses a storage-free tenant lookup for a viewer-only user', async ({page}) => {
        const requestLog = await setupDatabaseMocks(page, {isMonitoringAllowed: false});

        await openServerlessDatabaseMenu(page);

        expect(requestLog).toEqual({
            describeByPathId: [],
            tenantList: [
                {
                    metadataCache: 'false',
                    storage: 'false',
                    tablets: 'false',
                },
            ],
        });
    });

    test('falls back to a storage-free tenant lookup when describe fails', async ({page}) => {
        const requestLog = await setupDatabaseMocks(page, {
            describeResult: 'error',
            isMonitoringAllowed: true,
        });

        await openServerlessDatabaseMenu(page);

        expect(requestLog).toEqual({
            describeByPathId: [
                {
                    database: serverlessDatabase.Name,
                    pathId: serverlessDatabase.ResourceId,
                },
            ],
            tenantList: [
                {
                    metadataCache: 'false',
                    storage: 'false',
                    tablets: 'false',
                },
            ],
        });
    });
});
