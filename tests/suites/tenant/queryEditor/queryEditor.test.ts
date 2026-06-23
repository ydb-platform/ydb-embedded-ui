import {expect, test} from '@playwright/test';

import {
    cleanupMockStreamingFetch,
    setupMockStreamingHttpError,
} from '../../../utils/mockStreamingFetch';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {VISIBILITY_TIMEOUT} from '../TenantPage';
import {longRunningStreamQuery} from '../constants';

import {ResultTabNames} from './models/QueryEditor';
import {setupQueryEditor} from './queryEditor.helpers';

test.describe('Query editor screenshots', () => {
    test.afterEach(async ({page}) => {
        await cleanupMockStreamingFetch(page);
    });

    test('Error on non-Result tab shows Query Failed message for failed run', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);

        await queryEditor.paneWrapper.selectTab(ResultTabNames.ExplainPlan);

        const resultArea = queryEditor.getResultAreaLocator();
        await expect(resultArea).toHaveScreenshot('query-error-on-explain-tab.png');
    });

    test('Query streaming finishes with data', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toMatch(
            /^(Result|Truncated)$/,
        );
        const resultCount = Number(await queryEditor.resultTable.getResultTitleCount());
        expect(resultCount).toBeGreaterThan(0);
        const resultView = queryEditor.resultTable.getResultWrapperLocator();
        await expect(resultView).toHaveScreenshot('streaming-query-completed.png');
    });

    test('Streaming non-JSON HTTP error shows actual error body, not empty object', async ({
        page,
    }) => {
        const queryEditor = await setupQueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        const htmlBody = '<html><body><h1>502 Bad Gateway</h1><p>nginx</p></body></html>';
        await setupMockStreamingHttpError(page, {
            status: 502,
            statusText: 'Bad Gateway',
            body: htmlBody,
        });

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);

        const errorAlert = queryEditor.getResultAreaLocator().locator('.g-alert');
        await expect(errorAlert).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await expect(errorAlert).toContainText('502 Bad Gateway');

        const responseButton = errorAlert.getByRole('button', {name: 'Response'});
        await expect(responseButton).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await responseButton.click();

        const responseBody = errorAlert.locator('.ydb-response-body-section__code');
        await expect(responseBody).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await expect(responseBody).toContainText('502 Bad Gateway');
        await expect(responseBody).not.toContainText('{}');

        await expect(queryEditor.getResultAreaLocator()).toHaveScreenshot(
            'streaming-non-json-error.png',
        );
    });
});
