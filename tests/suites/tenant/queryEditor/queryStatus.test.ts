import {expect, test} from '@playwright/test';

import {STATISTICS_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
import {longRunningStreamQuery} from '../constants';

import {QueryEditor} from './models/QueryEditor';

test.describe('Test Query Execution Status', async () => {
    const testQuery = 'SELECT 1;'; // Simple query that will generate a plan

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'query',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('No query status when no query was executed', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Ensure page is loaded
        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);

        await expect(queryEditor.isResultsControlsHidden()).resolves.toBe(true);
    });

    test('Running query status for running query', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningStreamQuery);
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
