import {expect, test} from '@playwright/test';

import {backend, database} from '../../utils/constants';

import {TenantPage} from './TenantPage';

const backendPathPrefix = new URL(`${backend}/`).pathname.slice(0, -1);

const roles = [
    {
        name: 'database',
        isViewerAllowed: false,
        isMonitoringAllowed: false,
        isAdministrationAllowed: false,
        healthcheckAvailable: false,
    },
    {
        name: 'viewer',
        isViewerAllowed: true,
        isMonitoringAllowed: false,
        isAdministrationAllowed: false,
        healthcheckAvailable: false,
    },
    {
        name: 'monitoring',
        isViewerAllowed: true,
        isMonitoringAllowed: true,
        isAdministrationAllowed: false,
        healthcheckAvailable: true,
    },
    {
        name: 'administrator',
        isViewerAllowed: true,
        isMonitoringAllowed: true,
        isAdministrationAllowed: true,
        healthcheckAvailable: true,
    },
    {
        name: 'legacy backend without permission flags',
        isViewerAllowed: true,
        isMonitoringAllowed: undefined,
        isAdministrationAllowed: undefined,
        healthcheckAvailable: true,
    },
];

for (const navigationV2 of [false, true]) {
    for (const role of roles) {
        test(`healthcheck access: navigation v2=${navigationV2}, role=${role.name}`, async ({
            page,
        }) => {
            const healthcheckRequests: string[] = [];
            let hasElevatedAccess = false;
            await page.addInitScript((enabled) => {
                localStorage.setItem('enableTenantNavigationV2', JSON.stringify(enabled));
            }, navigationV2);
            await page.route(`${backend}/**`, async (route) => {
                const pathname = new URL(route.request().url()).pathname.slice(
                    backendPathPrefix.length,
                );
                let json = {};
                if (pathname === '/viewer/json/whoami') {
                    json = {
                        UserSID: 'healthcheck-test-user',
                        IsDatabaseAllowed: true,
                        IsViewerAllowed: hasElevatedAccess || role.isViewerAllowed,
                        IsMonitoringAllowed: hasElevatedAccess || role.isMonitoringAllowed,
                        IsAdministrationAllowed: role.isAdministrationAllowed,
                    };
                } else if (pathname === '/viewer/json/tenantinfo') {
                    json = {
                        TenantInfo: [
                            {Name: database, Type: 'Dedicated', State: 'RUNNING', Overall: 'Green'},
                        ],
                    };
                } else if (pathname === '/viewer/json/describe') {
                    json = {Path: database, PathDescription: {Self: {PathType: 'SubDomain'}}};
                } else if (pathname === '/viewer/json/healthcheck') {
                    healthcheckRequests.push(route.request().url());
                    json = {
                        self_check_result: 'DEGRADED',
                        issue_log: [
                            {
                                id: 'database-healthcheck-issue',
                                status: 'ORANGE',
                                message: 'Database healthcheck issue',
                                type: 'STORAGE',
                            },
                        ],
                    };
                } else if (pathname === '/viewer/json/nodelist') {
                    json = [];
                }
                await route.fulfill({json});
            });

            const tenantPage = new TenantPage(page);
            await tenantPage.goto({
                database,
                schema: database,
                databasePage: navigationV2 ? 'database' : 'diagnostics',
                showHealthcheck: 1,
                view: 'storage',
                issuesFilter: 'Database healthcheck issue',
            });
            await page.waitForLoadState('networkidle');
            await expect(page.locator('.tenant-overview')).toBeVisible();

            const drawer = page.getByTestId('tenant-healthcheck-details');
            const preview = page.locator(
                navigationV2
                    ? '.ydb-healthcheck-preview__compact-status'
                    : '.ydb-healthcheck-preview',
            );
            if (role.healthcheckAvailable) {
                await expect(preview).toBeVisible();
                await expect(drawer).toBeVisible();
                await expect(drawer).toContainText('Database healthcheck issue');
                await expect(page).toHaveURL(
                    (url) =>
                        url.searchParams.get('showHealthcheck') === '1' &&
                        url.searchParams.get('view') === 'storage' &&
                        url.searchParams.get('issuesFilter') === 'Database healthcheck issue',
                );
                expect(healthcheckRequests.length).toBeGreaterThan(0);
            } else {
                await expect(preview).toBeHidden();
                await expect(drawer).toBeHidden();
                expect(healthcheckRequests).toEqual([]);
                await expect(page).toHaveURL((url) =>
                    ['showHealthcheck', 'view', 'issuesFilter'].every(
                        (param) => !url.searchParams.has(param),
                    ),
                );

                hasElevatedAccess = true;
                await page.reload();
                await expect(page.locator('.tenant-overview')).toBeVisible();
                await expect(preview).toBeVisible();
                await expect(drawer).toBeHidden();
            }
        });
    }
}
