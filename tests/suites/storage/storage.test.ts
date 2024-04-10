import {expect, test} from '@playwright/test';

import {StoragePage} from './StoragePage';

test.describe('Test Storage page', async () => {
    test('Storage page is OK', async ({page}) => {
        const storagePage = new StoragePage(page);
        const response = await storagePage.goto();
        expect(response?.ok()).toBe(true);
    });

    test('Storage page has groups table', async ({page}) => {
        const storagePage = new StoragePage(page);
        await storagePage.goto();

        await storagePage.selectVisibleEntityType('All');
        await storagePage.selectEntityType('Groups');

        await expect(storagePage.table).toBeVisible();
    });

    test('Storage page has nodes table', async ({page}) => {
        const storagePage = new StoragePage(page);
        await storagePage.goto();

        await storagePage.selectVisibleEntityType('All');
        await storagePage.selectEntityType('Nodes');

        await expect(storagePage.table).toBeVisible();
    });
});
