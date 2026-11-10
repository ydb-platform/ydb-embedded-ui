import {expect, test} from '@playwright/test';

import {TenantsPage} from './TenantsPage';

test('shows source errors when the database list is empty', async ({page}) => {
    await page.route('**/viewer/**', async (route) => {
        const {pathname} = new URL(route.request().url());
        if (pathname.endsWith('/tenantinfo')) {
            await route.fulfill({
                json: {
                    TenantInfo: [],
                    errors: {
                        control_plane: 'Control plane unavailable',
                        viewer: 'Viewer unavailable',
                    },
                },
            });
        } else if (pathname.endsWith('/whoami')) {
            await route.fulfill({json: {IsViewerAllowed: true}});
        } else if (pathname.endsWith('/nodelist')) {
            await route.fulfill({json: []});
        } else {
            await route.fulfill({json: {}});
        }
    });

    const tenantsPage = new TenantsPage(page);
    await tenantsPage.goto();

    const error = tenantsPage.selector.locator('.ydb-response-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('control_plane: Control plane unavailable');
    await expect(error).toContainText('viewer: Viewer unavailable');
});
