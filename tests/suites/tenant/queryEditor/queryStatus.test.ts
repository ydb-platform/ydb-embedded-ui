import {expect, test} from '@playwright/test';

import {STATISTICS_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';
import {longRunningQuery, streamingStatusQuery} from '../constants';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

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

        // Large row limit + small chunk size forces many streaming chunks,
        // making status transitions observable
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(100000);
        await queryEditor.settingsDialog.changeOutputChunkMaxSize(10);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await queryEditor.setQuery(streamingStatusQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Fetching')).resolves.toBe(true);
    });

    test('Streaming query transitions from "Fetching" to "Completed"', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(100000);
        await queryEditor.settingsDialog.changeOutputChunkMaxSize(10);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await queryEditor.setQuery(streamingStatusQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Fetching')).resolves.toBe(true);
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
    });

    test('Streaming query status transitions follow correct order', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(100000);
        await queryEditor.settingsDialog.changeOutputChunkMaxSize(10);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await queryEditor.setQuery(streamingStatusQuery);
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

        expect(transitions[transitions.length - 1]).toBe('Completed');
    });
});
