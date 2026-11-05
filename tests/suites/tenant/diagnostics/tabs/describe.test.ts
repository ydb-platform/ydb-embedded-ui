import type {Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';

import {Describe} from './DescribeModel';

const getDescription = (name?: string) => `${name} object description `.repeat(5).trim();

async function mockDescribe(page: Page) {
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
                Description: getDescription(name),
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

    return {
        waitForDelayedDescribe: () => expect.poll(() => Boolean(releaseDescribe)).toBe(true),
        releaseDescribe: () => releaseDescribe?.(),
    };
}

async function openDescribe(page: Page) {
    const tenantPage = new TenantPage(page);
    await tenantPage.goto({
        database,
        schema: `${database}/first`,
        databasePage: 'diagnostics',
        diagnosticsTab: 'describe',
    });

    return new Describe(page);
}

test('Describe preserves expanded and collapsed fields when switching objects', async ({page}) => {
    const {waitForDelayedDescribe, releaseDescribe} = await mockDescribe(page);
    const describe = await openDescribe(page);

    await describe.toggleField('PathDescription');
    await describe.toggleField('Self');
    await expect(describe.getValue('first')).toBeVisible();

    await page.getByText('second', {exact: true}).click();
    await waitForDelayedDescribe();
    await expect(describe.getValue('first')).toBeHidden();
    releaseDescribe();
    await expect(describe.getValue('second')).toBeVisible();

    await describe.toggleField('Self');
    await page.getByText('first', {exact: true}).click();
    await expect(describe.getValue(`"${database}/first"`)).toBeVisible();
    await expect(describe.getFieldRow('Self')).toBeVisible();
    await expect(describe.getFieldRow('Name')).toBeHidden();
});

test('Describe closes Full value when the object changes', async ({page}) => {
    const {waitForDelayedDescribe, releaseDescribe} = await mockDescribe(page);
    const describe = await openDescribe(page);

    await describe.toggleField('PathDescription');
    await describe.openFullValue('Description');
    await expect(describe.getFullValueDialog()).toContainText(getDescription('first'));

    // The modal dialog blocks the schema tree, so the object can change only through browser history.
    await page.evaluate((path) => {
        const url = new URL(window.location.href);
        url.searchParams.set('schema', path);
        window.history.pushState(null, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }, `${database}/second`);
    await waitForDelayedDescribe();
    await expect(describe.getFullValueDialog()).toBeHidden();

    releaseDescribe();
    await expect(describe.getValue(`"${database}/second"`)).toBeVisible();
    await expect(describe.getFieldRow('Self')).toBeVisible();
    await expect(describe.getFullValueDialog()).toBeHidden();
});
