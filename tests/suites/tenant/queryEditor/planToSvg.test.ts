import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {StatisticsMode} from '../../../../src/types/store/query';
import {QUERY_MODES, STATISTICS_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

const testQuery = 'SELECT 1;';

async function setStatisticsMode(queryEditor: QueryEditor, statisticsMode: StatisticsMode) {
    await queryEditor.clickGearButton();
    await queryEditor.settingsDialog.changeStatsLevel(statisticsMode);
    await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
}

async function runQuery(queryEditor: QueryEditor) {
    await queryEditor.setQuery(testQuery);
    await queryEditor.clickRunButton();
    await expect(async () => {
        const status = await queryEditor.getExecutionStatus();
        expect(status).toBe('Completed');
    }).toPass();
}

async function openResultActions(page: Page) {
    const controls = page.locator('.ydb-query-result__controls-right');
    const executionPlan = page.getByRole('radio', {name: 'Execution Plan', exact: true});
    await executionPlan.click();
    return controls;
}

async function downloadExecutionPlan(page: Page) {
    const statuses: number[] = [];
    page.on('response', (response) => {
        if (
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname.endsWith('/plan2svg')
        ) {
            statuses.push(response.status());
        }
    });
    await openResultActions(page);
    const image = page.getByRole('img', {name: 'Execution Plan', exact: true});
    await expect(image).toBeVisible();
    await expect
        .poll(() =>
            image.evaluate(
                (element) =>
                    element instanceof HTMLImageElement &&
                    element.complete &&
                    element.naturalWidth > 0 &&
                    element.naturalHeight > 0,
            ),
        )
        .toBe(true);
    expect(statuses).toEqual([200]);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Download .SVG', exact: true}).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('query-plan.svg');
}

test.describe('Plan to SVG functionality @query-editor-redesign', () => {
    test.beforeEach(async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            databasePage: 'query',
        });
    });

    test('keeps plan actions for a Full result after current settings change', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await setStatisticsMode(queryEditor, STATISTICS_MODES.full);
        await runQuery(queryEditor);

        await setStatisticsMode(queryEditor, STATISTICS_MODES.none);
        await openResultActions(page);

        const downloadButton = page.getByRole('button', {name: 'Download .SVG', exact: true});
        await expect(downloadButton).toBeVisible();
        await expect(page.getByRole('img', {name: 'Execution Plan'})).toBeVisible();
    });

    test('downloads a Profile execution plan as SVG', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await setStatisticsMode(queryEditor, STATISTICS_MODES.profile);
        await runQuery(queryEditor);
        await downloadExecutionPlan(page);
    });

    for (const mode of [QUERY_MODES.query, QUERY_MODES.script]) {
        test(`downloads an Explain ${mode} plan without statistics`, async ({page}) => {
            const queryEditor = new QueryEditor(page);
            await queryEditor.clickGearButton();
            await queryEditor.settingsDialog.changeQueryMode(mode);
            await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.none);
            await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
            const query = `SELECT NodeId FROM \`${database}/.sys/nodes\` LIMIT 1;`;
            await queryEditor.setQuery(query);

            const requests: {action: string; stats: StatisticsMode}[] = [];
            page.on('request', (request) => {
                if (request.method() === 'POST' && request.url().includes('/query?')) {
                    const payload = request.postDataJSON();
                    if (payload.query?.includes(query)) {
                        requests.push({action: payload.action, stats: payload.stats});
                    }
                }
            });
            await queryEditor.clickExplainButton();
            await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
            expect(requests).toEqual([{action: `explain-${mode}`, stats: STATISTICS_MODES.none}]);
            await downloadExecutionPlan(page);
            expect(requests).toEqual([{action: `explain-${mode}`, stats: STATISTICS_MODES.none}]);
        });
    }

    test('handles plan conversion errors', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await setStatisticsMode(queryEditor, STATISTICS_MODES.full);
        await runQuery(queryEditor);

        await page.route('**/plan2svg**', (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: 'Failed to generate SVG',
            });
        });

        await openResultActions(page);
        await expect(page.locator('.ydb-execution-plan__error').getByRole('alert')).toBeVisible();
        await expect(page.getByRole('button', {name: 'Retry', exact: true})).toBeVisible();
    });

    test('does not show plan actions for a None statistics result', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await setStatisticsMode(queryEditor, STATISTICS_MODES.none);
        await runQuery(queryEditor);
        await openResultActions(page);

        await expect(page.getByText('Query plan not enabled', {exact: true})).toBeVisible();
        await expect(page.getByRole('button', {name: 'Open query settings'})).toBeVisible();
        await expect(page.getByRole('button', {name: 'Download .SVG', exact: true})).toHaveCount(0);
    });
});
