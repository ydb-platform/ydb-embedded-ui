import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';

test('Describe preserves expanded and collapsed fields when switching objects', async ({page}) => {
    let releaseDescribe: (() => void) | undefined;
    await page.route('**/viewer/**', async (route) => {
        const url = new URL(route.request().url());
        let json = {};

        if (url.pathname.endsWith('/capabilities')) {
            json = {Capabilities: {}, Settings: {}};
        } else if (url.pathname.endsWith('/whoami')) {
            json = {IsViewerAllowed: true, IsDatabaseAllowed: true};
        } else if (url.pathname.endsWith('/tenantinfo')) {
            json = {TenantInfo: [{Name: database, Type: 'Dedicated'}]};
        } else if (url.pathname.endsWith('/describe')) {
            const path = url.searchParams.get('path') || database;
            const name = path.split('/').pop();
            if (path.endsWith('/second') && url.searchParams.get('subs') === '0') {
                await new Promise<void>((resolve) => {
                    releaseDescribe = resolve;
                });
            }
            json = {
                Status: 'StatusSuccess',
                Path: path,
                PathDescription: {
                    Self: {Name: name, PathType: 'EPathTypeDir'},
                    Children:
                        path === database
                            ? ['first', 'second'].map((Name) => ({Name, PathType: 'EPathTypeDir'}))
                            : [],
                },
            };
        }

        await route.fulfill({json});
    });

    const tenantPage = new TenantPage(page);
    await tenantPage.goto({
        database,
        schema: `${database}/first`,
        databasePage: 'diagnostics',
        diagnosticsTab: 'describe',
    });

    const describe = page.locator('.ydb-describe');
    const pathDescription = describe.locator('[title="PathDescription"] button');
    const self = describe.locator('[title="PathDescription/Self"] button');
    await pathDescription.click();
    await self.click();
    await expect(describe.getByText('first', {exact: true})).toBeVisible();

    await page.getByText('second', {exact: true}).click();
    await expect.poll(() => Boolean(releaseDescribe)).toBe(true);
    await expect(describe.getByText('first', {exact: true})).toBeHidden();
    releaseDescribe?.();
    await expect(describe.getByText('second', {exact: true})).toBeVisible();

    await self.click();
    await page.getByText('first', {exact: true}).click();
    await expect(describe.getByText(`"${database}/first"`, {exact: true})).toBeVisible();
    await expect(self).toBeVisible();
    await expect(describe.getByText('Name', {exact: true})).toBeHidden();
});
