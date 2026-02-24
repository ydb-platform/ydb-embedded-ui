import {expect, test} from '@playwright/test';

import {STATISTICS_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';
import {longRunningQuery, longerRunningStreamQuery} from '../constants';

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
        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);

        await expect(queryEditor.isResultsControlsHidden()).resolves.toBe(true);
    });

    test('Running query status for running non-streaming query', async ({page}) => {
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

    test('Streaming query shows "Fetching" status while receiving data', async ({
        page,
        browserName,
    }) => {
        test.skip(browserName === 'webkit');

        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await queryEditor.setQuery(longerRunningStreamQuery);
        await queryEditor.clickRunButton();

        // longerRunningStreamQuery generates a large result set
        // After data starts arriving, status should be "Fetching"
        await expect(queryEditor.waitForStatus('Fetching')).resolves.toBe(true);
    });

    test('Streaming query transitions from "Fetching" to "Completed"', async ({
        page,
        browserName,
    }) => {
        test.skip(browserName === 'webkit');

        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await queryEditor.setQuery(longerRunningStreamQuery);
        await queryEditor.clickRunButton();

        // Wait for fetching phase
        await expect(queryEditor.waitForStatus('Fetching')).resolves.toBe(true);

        // Eventually should complete
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
    });
});
