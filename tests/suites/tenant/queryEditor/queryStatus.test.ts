import {expect, test} from '@playwright/test';

import {tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
import {longRunningQuery} from '../constants';

import {QueryEditor} from './QueryEditor';

test.describe('Test Plan to SVG functionality', async () => {
    const testQuery = 'SELECT 1;'; // Simple query that will generate a plan

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            general: 'query',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('No query status when no query was executed', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Ensure page is loaded
        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel('Profile');

        await expect(queryEditor.isResultsControlsHidden()).resolves.toBe(true);
    });

    test('Running query status for running query', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(500);

        const statusElement = await queryEditor.getExecutionStatus();
        await expect(statusElement).toBe('Running');
    });

    test('Completed query status for completed query', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(1000);

        const statusElement = await queryEditor.getExecutionStatus();
        await expect(statusElement).toBe('Completed');
    });

    test('Failed query status for failed query', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(1000);

        const statusElement = await queryEditor.getExecutionStatus();
        await expect(statusElement).toBe('Failed');
    });
});
