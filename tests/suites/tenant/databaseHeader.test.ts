import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {TTenant, TTenantInfo} from '../../../src/types/api/tenant';
import {getClipboardContent} from '../../utils/clipboard';

import {TenantPage} from './TenantPage';

const databaseName = '/local/database-header';
const databaseId = 'database-id';

async function openDatabase(
    page: Page,
    tenant: Pick<TTenant, 'Id' | 'ControlPlane'>,
    errors?: TTenantInfo['errors'],
) {
    await page.addInitScript(() => {
        localStorage.setItem('enableTenantNavigationV2', JSON.stringify(true));
    });
    await page.route('**/viewer/**', async (route) => {
        const {pathname} = new URL(route.request().url());
        if (pathname.endsWith('/tenantinfo')) {
            await route.fulfill({
                json: {
                    TenantInfo: [
                        {Id: databaseId, Name: databaseName, Type: 'Dedicated', ...tenant},
                    ],
                    errors,
                },
            });
        } else if (pathname.endsWith('/whoami')) {
            await route.fulfill({json: {IsViewerAllowed: true}});
        } else {
            await route.fulfill({json: {}});
        }
    });

    const tenantPage = new TenantPage(page);
    await tenantPage.goto(
        {database: databaseName, databasePage: 'database', diagnosticsTab: 'database'},
        {waitUntil: 'networkidle'},
    );
    return page.getByTestId('database-header');
}

test.describe('Database header ID', () => {
    test('shows and copies the database ID with a control plane', async ({page}) => {
        const header = await openDatabase(page, {ControlPlane: {id: 'another-cp-id'}});

        await expect(header).toContainText(databaseName);
        await expect(header.getByText(databaseId, {exact: true})).toBeVisible();
        await header.getByRole('button', {name: 'Copy Database', exact: true}).click();
        await expect.poll(() => getClipboardContent(page)).toBe(databaseId);
    });

    test('shows the database ID when the control plane is unavailable', async ({page}) => {
        const header = await openDatabase(page, {}, {control_plane: 'Unavailable'});
        await expect(header.getByText(databaseId, {exact: true})).toBeVisible();
    });

    test('hides the database ID without a control plane or its error', async ({page}) => {
        const header = await openDatabase(page, {});
        await expect(header).toHaveText(databaseName);
        await expect(header.getByRole('button', {name: 'Copy Database', exact: true})).toBeHidden();
    });
});
