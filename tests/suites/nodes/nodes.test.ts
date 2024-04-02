import {expect, test} from '@playwright/test';

import {NodesPage} from './NodesPage';

test.describe('Test Nodes page', async () => {
    test('Nodes page is OK', async ({page}) => {
        const nodesPage = new NodesPage(page);
        const response = await nodesPage.goto();
        expect(response?.ok()).toBe(true);
    });

    test('Nodes page has nodes table', async ({page}) => {
        const nodesPage = new NodesPage(page);

        // Get table with all nodes
        await nodesPage.goto({problemFilter: 'All'});

        // Check if table is present
        await expect(nodesPage.table).toBeVisible();
    });
});
