import {expect, test} from '@playwright/test';

import {STATISTICS_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {
    cleanupMockStreamingFetch,
    setupMockStreamingFetch,
} from '../../../utils/mockStreamingFetch';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';
import {longRunningQuery} from '../constants';

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

    test.afterEach(async ({page}) => {
        await cleanupMockStreamingFetch(page);
    });

    test('No query status when no query was executed', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Ensure page is loaded
        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);

        await expect(queryEditor.isResultsControlsHidden()).resolves.toBe(true);
    });

    test('In-progress query shows a loading status', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        const inProgressStatuses = ['Preparing', 'Running', 'Fetching'];
        await expect(queryEditor.waitForAnyStatus(inProgressStatuses)).resolves.toBeTruthy();
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

    test('Streaming query shows "Fetching" status while receiving data', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        // Mock fetch — real small-chunk streaming freezes Safari's main thread
        await setupMockStreamingFetch(page);

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Fetching')).resolves.toBe(true);
    });

    test('Streaming query transitions from "Fetching" to "Completed"', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        // Mock completes after 10 data chunks then sends QueryResponse
        await setupMockStreamingFetch(page, {totalChunks: 10});

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Fetching')).resolves.toBe(true);
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
    });

    test('Streaming query status transitions follow correct order', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        // Mock completes after 10 data chunks then sends QueryResponse
        await setupMockStreamingFetch(page, {totalChunks: 10});

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        const validStreamingStatuses = ['Preparing', 'Running', 'Fetching', 'Completed'];
        const transitions = await queryEditor.collectStatusTransitions('Completed');

        for (let i = 0; i < transitions.length; i++) {
            expect(validStreamingStatuses).toContain(transitions[i]);
            if (i > 0) {
                const prevIndex = validStreamingStatuses.indexOf(transitions[i - 1]);
                const currIndex = validStreamingStatuses.indexOf(transitions[i]);
                expect(currIndex).toBeGreaterThan(prevIndex);
            }
        }

        expect(transitions).toContain('Running');
        expect(transitions[transitions.length - 1]).toBe('Completed');
    });

    test('Streaming query reaches "Running" when SessionCreated arrives in split chunks', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await setupMockStreamingFetch(page, {
            totalChunks: 5,
            splitSessionPart: true,
            chunkIntervalMs: 1000,
        });

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Running')).resolves.toBe(true);
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
    });

    test('Streaming query shows "Failed" status on server error', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        // Mock sends 3 data chunks then a QueryResponse with error/issues fields
        await setupMockStreamingFetch(page, {errorAfterChunks: 3});

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);
    });
});
