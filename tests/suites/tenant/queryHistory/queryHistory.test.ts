import {expect, test} from '@playwright/test';

import {QUERY_MODES} from '../../../../src/utils/query';
import {tenantName} from '../../../utils/constants';
import {TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {QueryEditor} from '../queryEditor/models/QueryEditor';

import executeQueryWithKeybinding from './utils';

test.describe('Query History', () => {
    let tenantPage: TenantPage;
    let queryEditor: QueryEditor;

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            general: 'query',
        };

        tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
        queryEditor = new QueryEditor(page);
    });

    test('New query appears in history after execution', async ({page}) => {
        const testQuery = 'SELECT 1 AS test_column;';

        // Execute the query
        await queryEditor.run(testQuery, QUERY_MODES.script);

        // Navigate to the history tab
        await page.click('text=History');

        // Check if the query appears in the history
        const historyTable = page.locator('.ydb-queries-history table');
        await expect(historyTable.locator(`text="${testQuery}"`)).toBeVisible({
            timeout: VISIBILITY_TIMEOUT,
        });
    });

    test('Multiple queries appear in correct order in history', async ({page}) => {
        const queries = [
            'SELECT 1 AS first_query;',
            'SELECT 2 AS second_query;',
            'SELECT 3 AS third_query;',
        ];

        // Execute multiple queries
        for (const query of queries) {
            await queryEditor.run(query, QUERY_MODES.script);
        }

        // Navigate to the history tab
        await page.click('text=History');

        // Check if queries appear in reverse order (most recent first)
        const historyTable = page.locator('.ydb-queries-history table');
        const rows = historyTable.locator('tbody tr');

        await expect(rows).toHaveCount(queries.length);

        for (let i = 0; i < queries.length; i++) {
            await expect(rows.nth(i)).toContainText(queries[queries.length - 1 - i]);
        }
    });

    test('Query executed with keybinding is saved in history', async ({page, browserName}) => {
        const testQuery = 'SELECT 1 AS keybinding_test;';

        // Focus on the query editor
        await queryEditor.focusEditor();

        // Type the query
        await page.keyboard.type(testQuery);

        // Use the keybinding to execute the query
        await executeQueryWithKeybinding(page, browserName);

        // Wait for the query to be executed
        await page.waitForSelector('.ydb-query-result-sets-viewer__result', {timeout: 10000});

        // Navigate to the history tab
        await page.click('text=History');

        // Check if the query appears in the history
        const historyTable = page.locator('.ydb-queries-history table');
        await expect(historyTable.locator(`text="${testQuery}"`)).toBeVisible();
    });
});
