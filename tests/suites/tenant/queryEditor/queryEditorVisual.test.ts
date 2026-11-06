import path from 'node:path';

import {expect, test} from '@playwright/test';
import type {Locator, Page} from '@playwright/test';

import {backend, database} from '../../../utils/constants';
import {toggleEditorSetting} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

import response from './fixtures/visual/query-response.json';

const query = `SELECT value, value * 2 AS doubled
FROM AS_TABLE([<|value: 1|>, <|value: 2|>, <|value: 3|>])
WHERE value > 1
ORDER BY value DESC;`;
const executionPlan = path.join(__dirname, 'fixtures/visual/execution-plan.svg');

function resultViews(page: Page) {
    return page.locator('.ydb-query-result__controls-left');
}

async function selectResultView(page: Page, name: string) {
    await resultViews(page).getByRole('radio', {name, exact: true}).check();
}

async function setStatistics(editor: QueryEditor, mode: 'none' | 'basic' | 'full') {
    await editor.clickGearButton();
    await editor.settingsDialog.changeStatsLevel(mode);
    await editor.settingsDialog.clickButton(ButtonNames.Save);
}

async function expectCompleted(editor: QueryEditor) {
    await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
}

async function expectExecutionPlan(page: Page) {
    const image = page.getByRole('img', {name: 'Execution Plan', exact: true});
    await expect(image).toBeVisible();
    await expect
        .poll(() =>
            image.evaluate(
                (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
            ),
        )
        .toBe(true);
}

test.use({viewport: {width: 1440, height: 1000}});

for (const theme of ['light', 'dark']) {
    test.describe(`Approved query editor screenshots in ${theme} @query-editor-redesign`, () => {
        test.beforeEach(async ({page}) => {
            await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
            // Keep the execution label stable without masking its typography or layout.
            await page.clock.setFixedTime(new Date('2026-11-06T10:00:00Z'));
            await page.route(`${backend}/viewer/json/query?*`, (route) =>
                route.fulfill({json: response}),
            );
            await page.route('**/plan2svg?*', (route) =>
                route.fulfill({path: executionPlan, contentType: 'image/svg+xml'}),
            );
            const tenant = new TenantPage(page);
            await tenant.gotoQueryEditor({database, schema: database});
            await toggleEditorSetting(page, 'off', 'Query Streaming');
            await setStatistics(tenant.queryEditor, 'full');
            await expect(page.locator('body')).toHaveClass(new RegExp(`g-root_theme_${theme}`));
        });

        async function screenshot(page: Page, name: string, region?: Locator) {
            await page.mouse.move(0, 0);
            await expect(region || page.locator('.query-editor')).toHaveScreenshot(
                `${name}-${theme}.png`,
                {maxDiffPixelRatio: 0},
            );
        }

        test('Run toolbar and result views', async ({page}) => {
            const editor = new QueryEditor(page);
            await editor.setQuery(query);
            await editor.focusHotkeysTarget();
            await screenshot(page, 'editor-ready');
            await editor.run(query, 'query');
            await expectCompleted(editor);
            await selectResultView(page, 'Result 1');
            await expect(page.getByText('4 rows/s', {exact: true})).toBeVisible();
            await screenshot(page, 'run-result');

            await selectResultView(page, 'Query Plan');
            const planViews = page.locator('.ydb-query-plan__switcher');
            await planViews.getByRole('radio', {name: 'Table', exact: true}).check();
            await expect(page.locator('.ydb-query-simplified-plan tbody tr')).toHaveCount(2);
            await screenshot(page, 'run-plan-table');
            await planViews.getByRole('radio', {name: 'Graph', exact: true}).check();
            await expect(page.locator('.ydb-gravity-graph__block-content').first()).toBeVisible();
            await screenshot(page, 'run-plan-graph');
            await planViews.getByRole('radio', {name: 'JSON', exact: true}).check();
            await expect(page.locator('.ydb-query-json-viewer')).toBeVisible();
            await screenshot(page, 'run-plan-json');

            await selectResultView(page, 'Execution Plan');
            await expectExecutionPlan(page);
            await screenshot(page, 'run-execution-plan');
            await selectResultView(page, 'Stats');
            await expect(page.locator('.ydb-query-json-viewer')).toBeVisible();
            await screenshot(page, 'run-stats');
        });

        test('Explain navigation and plan views', async ({page}) => {
            const editor = new QueryEditor(page);
            await editor.explain(query, 'query');
            await expectCompleted(editor);
            await expect(resultViews(page).getByRole('radio')).toHaveCount(3);
            await expect(page.locator('.ydb-query-simplified-plan')).toBeVisible();
            await screenshot(page, 'explain-plan-table');
            await selectResultView(page, 'Execution Plan');
            await expectExecutionPlan(page);
            await screenshot(page, 'explain-execution-plan');
        });

        test('Explain AST and keyboard tooltip', async ({page}) => {
            const editor = new QueryEditor(page);
            await editor.explain(query, 'query');
            await expectCompleted(editor);
            await selectResultView(page, 'AST');
            await expect(page.locator('.ydb-query-result__result .monaco-editor')).toBeVisible();
            await screenshot(page, 'explain-ast');
            await resultViews(page).getByRole('radio', {name: 'AST', exact: true}).focus();
            await expect(page.getByText(/AST \(Abstract Syntax Tree\)/)).toBeVisible();
            await screenshot(page, 'explain-ast-tooltip');
        });

        test('Explain Analyze result and fullscreen execution plan', async ({page}) => {
            const editor = new QueryEditor(page);
            await editor.explainAnalyze(query, 'query');
            await expectCompleted(editor);
            await selectResultView(page, 'Result 1');
            await screenshot(page, 'analyze-result');
            await selectResultView(page, 'Execution Plan');
            await expectExecutionPlan(page);
            await page.getByRole('button', {name: 'Fullscreen', exact: true}).click();
            const fullscreen = page.locator('.ydb-fullscreen_fullscreen');
            await expect(fullscreen).toBeVisible();
            await screenshot(page, 'analyze-execution-fullscreen', fullscreen);
        });

        for (const {mode, view, title, snapshot} of [
            {
                mode: 'none',
                view: 'Stats',
                title: 'Statistics not enabled',
                snapshot: 'stats-not-enabled',
            },
            {
                mode: 'basic',
                view: 'Query Plan',
                title: 'Query plan not enabled',
                snapshot: 'plan-not-enabled',
            },
        ] as const) {
            test(`${view} not enabled`, async ({page}) => {
                const editor = new QueryEditor(page);
                await page.route(`${backend}/viewer/json/query?*`, (route) =>
                    route.fulfill({json: {result: response.result}}),
                );
                await setStatistics(editor, mode);
                await editor.run(query, 'query');
                await expectCompleted(editor);
                await selectResultView(page, view);
                await expect(page.getByText(title, {exact: true})).toBeVisible();
                await screenshot(page, snapshot);
            });
        }
    });
}
