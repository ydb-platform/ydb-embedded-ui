import {expect, test} from '@playwright/test';

import {QUERY_MODES} from '../../../../src/utils/query';
import {VISIBILITY_TIMEOUT} from '../TenantPage';

import {ExplainResultType} from './models/QueryEditor';
import {setupQueryEditor, testQuery} from './queryEditor.helpers';

test.describe('Query editor execution', () => {
    test('Run button executes YQL script', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.run(testQuery, QUERY_MODES.script);

        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Run button executes Scan', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.run(testQuery, QUERY_MODES.scan);

        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Explain button executes YQL script explanation', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.explain(testQuery, QUERY_MODES.script);

        const explainSchema = await queryEditor.getExplainResult(ExplainResultType.Schema);
        await expect(explainSchema).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainJSON = await queryEditor.getExplainResult(ExplainResultType.JSON);
        await expect(explainJSON).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Explain button executes Scan explanation', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.explain(testQuery, QUERY_MODES.scan);

        const explainSchema = await queryEditor.getExplainResult(ExplainResultType.Schema);
        await expect(explainSchema).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainJSON = await queryEditor.getExplainResult(ExplainResultType.JSON);
        await expect(explainJSON).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainAST = await queryEditor.getExplainResult(ExplainResultType.AST);
        await expect(explainAST).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Error is displayed for invalid query for run', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);
        const errorMessage = await queryEditor.getErrorMessage();
        await expect(errorMessage).toContain('Column references are not allowed without FROM');
    });

    test('Error is displayed for invalid query for explain', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickExplainButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);
        const errorMessage = await queryEditor.getErrorMessage();
        await expect(errorMessage).toContain('Column references are not allowed without FROM');
    });

    test('Run and Explain buttons are disabled when query is empty', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        await expect(queryEditor.isRunButtonEnabled()).resolves.toBe(false);
        await expect(queryEditor.isExplainButtonEnabled()).resolves.toBe(false);

        await queryEditor.setQuery(testQuery);

        await expect(queryEditor.isRunButtonEnabled()).resolves.toBe(true);
        await expect(queryEditor.isExplainButtonEnabled()).resolves.toBe(true);
    });

    test('Query execution status changes correctly', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
    });
});
