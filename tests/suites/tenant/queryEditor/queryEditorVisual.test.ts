import path from 'node:path';

import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

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

test.beforeEach(async ({page}) => {
    // Keep the execution label stable without masking its typography or layout.
    await page.clock.setFixedTime(new Date('2026-11-06T10:00:00Z'));
    await page.route(`${backend}/viewer/json/query?*`, (route) => route.fulfill({json: response}));
    await page.route('**/plan2svg?*', (route) =>
        route.fulfill({path: executionPlan, contentType: 'image/svg+xml'}),
    );
    const tenant = new TenantPage(page);
    await tenant.gotoQueryEditor({database, schema: database});
    await toggleEditorSetting(page, 'off', 'Query Streaming');
    await setStatistics(tenant.queryEditor, 'full');
});

for (const theme of ['light', 'dark']) {
    test.describe(`Query editor layout in ${theme} @query-editor-redesign`, () => {
        test.beforeEach(async ({page}) => {
            await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
            await page.reload({waitUntil: 'domcontentloaded'});
            await expect(page.locator('body')).toHaveClass(new RegExp(`g-root_theme_${theme}`));
        });

        test('plan table and fullscreen SVG', async ({page}) => {
            const editor = new QueryEditor(page);
            await editor.run(query, 'query');
            await expectCompleted(editor);
            await selectResultView(page, 'Query Plan');
            await expect(page.locator('.ydb-query-simplified-plan tbody tr')).toHaveCount(2);
            await page.mouse.move(0, 0);
            await expect(page.locator('.query-editor')).toHaveScreenshot(
                `run-plan-table-${theme}.png`,
                {maxDiffPixelRatio: 0},
            );

            await editor.explainAnalyze(query, 'query');
            await expectCompleted(editor);
            await selectResultView(page, 'Execution Plan');
            await expectExecutionPlan(page);
            await page.getByRole('button', {name: 'Fullscreen', exact: true}).click();
            const fullscreen = page.locator('.ydb-fullscreen_fullscreen');
            await expect(fullscreen).toBeVisible();
            await page.mouse.move(0, 0);
            await expect(fullscreen).toHaveScreenshot(`analyze-execution-fullscreen-${theme}.png`, {
                maxDiffPixelRatio: 0,
            });
        });
    });
}

for (const {mode, view, title, hint} of [
    {
        mode: 'none',
        view: 'Stats',
        title: 'Statistics not enabled',
        hint: 'Select Basic or Full mode',
    },
    {
        mode: 'basic',
        view: 'Query Plan',
        title: 'Query plan not enabled',
        hint: 'Select Full mode',
    },
] as const) {
    test(`${view} disabled state and settings action @query-editor-redesign`, async ({page}) => {
        const editor = new QueryEditor(page);
        let requests = 0;
        let conversions = 0;
        await page.route('**/plan2svg?*', (route) => {
            conversions++;
            return route.abort();
        });
        await page.route(`${backend}/viewer/json/query?*`, (route) => {
            requests++;
            return route.fulfill({json: {result: response.result}});
        });
        await setStatistics(editor, mode);
        await editor.run(query, 'query');
        await expectCompleted(editor);
        await selectResultView(page, view);
        const placeholder = page.locator('.ydb-query-data-not-enabled');
        await expect(placeholder.getByText(title, {exact: true})).toBeVisible();
        await expect(page.locator('.ydb-query-plan__switcher')).toHaveCount(0);
        await expect(placeholder).toHaveCSS('filter', 'none');
        const description = placeholder.locator('.ydb-query-data-not-enabled__description');
        await expect(description).toContainText(hint);
        await expect.soft(description).toHaveCSS('font-size', '13px');
        await expect.soft(description).toHaveCSS('line-height', '18px');
        await expect.soft(description).toHaveCSS('font-weight', '400');
        const views = page.locator('.ydb-query-result__controls-left');
        await views.getByRole('radio', {name: 'Execution Plan', exact: true}).check();
        await expect(placeholder.getByText('Query plan not enabled', {exact: true})).toBeVisible();
        expect(conversions).toBe(0);
        await placeholder
            .getByRole('button', {name: 'Open query settings', exact: true})
            .press('Enter');
        await expect(page.locator('.ydb-query-settings-dialog')).toBeVisible();
        expect(requests).toBe(1);
        await editor.settingsDialog.changeStatsLevel('full');
        await editor.settingsDialog.clickButton(ButtonNames.Save);
        await expect(placeholder.getByText('Query plan not enabled', {exact: true})).toBeVisible();
        await views.getByRole('radio', {name: view, exact: true}).check();
        await expect(placeholder.getByText(title, {exact: true})).toBeVisible();
        expect(requests).toBe(1);
        await editor.run(query, 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        await page
            .locator('.ydb-query-result__controls-left')
            .getByRole('radio', {name: view, exact: true})
            .check();
        await expect(placeholder).toHaveCount(0);
        await expect(
            page.getByText(`There is no ${view} for the request`, {exact: true}),
        ).toBeVisible();
        expect(requests).toBe(2);
    });
}
