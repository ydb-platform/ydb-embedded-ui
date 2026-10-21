import {readFile} from 'node:fs/promises';

import {expect, test} from '@playwright/test';
import type {Download, Page, Route} from '@playwright/test';

import {backend, database} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import type {QueryEditor} from './models/QueryEditor';

const queryUrl = `${backend}/viewer/json/query?*`;
const plan = {
    meta: {version: '0.2', type: 'query'},
    Plan: {'Node Type': 'Query', Plans: [{'Node Type': 'ResultSet', PlanNodeId: 1}]},
    SimplifiedPlan: {
        'Node Type': 'Query',
        Plans: [
            {
                'Node Type': 'Scan',
                Operators: [{Name: 'Scan', 'A-Rows': 0, 'E-Rows': 2}],
                Plans: [{'Node Type': 'Filter', Operators: [{Name: 'Filter', 'A-Cpu': 0}]}],
            },
        ],
    },
};
const makeResponse = () => ({
    plan,
    ast: '(return (Int32 1))',
    resultSets: [
        {columns: [{name: 'value', type: 'Int32'}], result: [{value: 1}], truncated: false},
    ],
    stats: {DurationUs: '500000', Executions: [{ResultRows: '1', DurationUs: '500000'}]},
});
const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"><text x="10" y="50">Current plan</text></svg>';

async function readDownload(download: Download) {
    const path = await download.path();
    if (!path) {
        throw new Error('Expected a downloaded file');
    }
    return readFile(path, 'utf8');
}

function mainViews(page: Page) {
    return page.locator('.ydb-query-result__controls-left .g-segmented-radio-group');
}
function planViews(page: Page) {
    return page.locator('.ydb-query-plan__switcher');
}
async function selectView(page: Page, name: string) {
    await mainViews(page).getByRole('radio', {name, exact: true}).check();
}
async function openEditor(page: Page) {
    const tenant = new TenantPage(page);
    await tenant.gotoQueryEditor({schema: database, database});
    return tenant.queryEditor;
}
async function analyze(editor: QueryEditor) {
    await editor.explainAnalyze('SELECT 1;', 'query');
    await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
}

test.describe('Query editor redesign @query-editor-redesign', () => {
    test('real Explain never executes and Analyze retains results', async ({page}, testInfo) => {
        const editor = await openEditor(page);
        const actions: string[] = [];
        page.on('request', (request) => {
            if (request.url().includes('/viewer/json/query') && request.method() === 'POST') {
                actions.push(request.postDataJSON().action);
            }
        });
        await editor.explain('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        expect(actions).toEqual(['explain-query']);
        await expect(mainViews(page).getByRole('radio')).toHaveCount(3);
        await expect(
            mainViews(page).getByRole('radio', {name: 'Query Plan', exact: true}),
        ).toBeChecked();
        await expect(
            planViews(page).getByRole('radio', {name: 'Table', exact: true}),
        ).toBeChecked();
        await planViews(page).getByRole('radio', {name: 'Graph', exact: true}).check();
        const firstTab = await editor.getRequiredActiveTabId();
        await editor.editorTabs.clickAddTab();
        await editor.editorTabs.selectTabById(firstTab);
        await expect(
            planViews(page).getByRole('radio', {name: 'Graph', exact: true}),
        ).toBeChecked();
        await selectView(page, 'AST');
        await selectView(page, 'Query Plan');
        await expect(
            planViews(page).getByRole('radio', {name: 'Graph', exact: true}),
        ).toBeChecked();
        await selectView(page, 'Execution Plan');
        await expect(page.getByRole('img', {name: 'Execution Plan'})).toBeVisible();
        expect(actions).toEqual(['explain-query']);
        await analyze(editor);
        await expect(mainViews(page).getByRole('radio')).toHaveCount(4);
        await expect(
            planViews(page).getByRole('radio', {name: 'Table', exact: true}),
        ).toBeChecked();
        await mainViews(page)
            .getByRole('radio', {name: /^Result/})
            .check();
        await expect(editor.resultTable.isVisible()).resolves.toBe(true);
        expect(actions).toEqual(['explain-query', 'execute-query']);
        await page.screenshot({path: testInfo.outputPath('real-analyze-result.png')});
    });

    test('real SVG download equals the displayed SVG and diagnostics retain their fields', async ({
        page,
    }, testInfo) => {
        const editor = await openEditor(page);
        await analyze(editor);
        const responsePromise = page.waitForResponse((response) =>
            response.url().includes('/plan2svg'),
        );
        await selectView(page, 'Execution Plan');
        const response = await responsePromise;
        expect(response.status()).toBe(200);
        const expectedSvg = await response.text();
        const image = page.getByRole('img', {name: 'Execution Plan'});
        await expect(image).toBeVisible();
        await expect
            .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
            .toBeGreaterThan(0);
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', {name: 'Download .SVG', exact: true}).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('query-plan.svg');
        expect(await readDownload(download)).toBe(expectedSvg);
        const diagnosticsPromise = page.waitForEvent('download');
        await page.getByRole('button', {name: 'Diagnostics .JSON', exact: true}).click();
        const diagnostics = await diagnosticsPromise;
        const json = JSON.parse(await readDownload(diagnostics));
        expect(json).toMatchObject({database, queryText: 'SELECT 1;'});
        expect(json.plan).toBeDefined();
        expect(json.stats).toBeDefined();
        await page.screenshot({path: testInfo.outputPath('real-execution-plan.png')});
    });

    test('mocked summary distinguishes exact, truncated and multiple results', async ({
        page,
    }, testInfo) => {
        const editor = await openEditor(page);
        const response = makeResponse();
        await page.route(queryUrl, (route) => route.fulfill({json: response}));
        await analyze(editor);
        await mainViews(page).getByRole('radio', {name: 'Result 1', exact: true}).check();
        await expect(page.getByText('2 rows/s', {exact: true})).toBeVisible();
        response.resultSets[0].truncated = true;
        await analyze(editor);
        await mainViews(page).getByRole('radio', {name: 'Result 1', exact: true}).check();
        await expect(page.getByText(/rows\/s/)).toHaveCount(0);
        await expect(page.getByText('Truncated', {exact: true})).toBeVisible();
        response.resultSets[0].truncated = false;
        response.resultSets.push({
            columns: [{name: 'value', type: 'Int32'}],
            result: [{value: 2}],
            truncated: false,
        });
        await analyze(editor);
        await mainViews(page).getByRole('radio', {name: 'Result 2', exact: true}).check();
        await expect(page.getByText(/rows\/s/)).toHaveCount(0);
        await page.getByRole('tab', {name: /Result #2/}).click();
        await expect(editor.resultTable.getCellValue(1, 2)).resolves.toBe('2');
        await page.screenshot({path: testInfo.outputPath('multiple-results.png')});
    });

    test('mocked SVG failure retries and a late response cannot replace the next execution', async ({
        page,
    }, testInfo) => {
        const editor = await openEditor(page);
        let queryNumber = 0;
        await page.route(queryUrl, (route) =>
            route.fulfill({
                json: {...makeResponse(), plan: {...plan, tables: [{name: String(++queryNumber)}]}},
            }),
        );
        let held: Route | undefined;
        let conversion = 0;
        await page.route('**/plan2svg?*', async (route) => {
            conversion += 1;
            if (conversion === 1) {
                await route.fulfill({status: 400, body: 'Conversion failed'});
            } else if (conversion === 2) {
                held = route;
            } else {
                await route.fulfill({contentType: 'image/svg+xml', body: svg});
            }
        });
        await analyze(editor);
        await selectView(page, 'Execution Plan');
        await expect(page.locator('.ydb-execution-plan__error').getByRole('alert')).toBeVisible();
        await page.getByRole('button', {name: 'Retry', exact: true}).click();
        await expect.poll(() => Boolean(held)).toBe(true);
        await analyze(editor);
        await selectView(page, 'Execution Plan');
        const image = page.getByRole('img', {name: 'Execution Plan'});
        await expect(image).toBeVisible();
        const currentSource = await image.getAttribute('src');
        if (!held || !currentSource) {
            throw new Error('Expected the delayed conversion and the current SVG');
        }
        await held.fulfill({
            contentType: 'image/svg+xml',
            body: svg.replace('Current plan', 'OLD PLAN'),
        });
        await expect(image).toHaveAttribute('src', currentSource);
        await selectView(page, 'Query Plan');
        await selectView(page, 'Execution Plan');
        await expect(image).toBeVisible();
        expect(conversion).toBe(3);
        await page.screenshot({path: testInfo.outputPath('svg-after-late-response.png')});
    });

    test('table hierarchy, JSON, keyboard AST tooltip and toolbar in light/dark narrow layout', async ({
        page,
    }, testInfo) => {
        const editor = await openEditor(page);
        await page.route(queryUrl, (route) => route.fulfill({json: makeResponse()}));
        await page.route('**/plan2svg?*', (route) =>
            route.fulfill({contentType: 'image/svg+xml', body: svg}),
        );
        await editor.explain('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        for (const name of ['Operation', 'A-Cpu', 'A-Rows', 'E-Cost', 'E-Rows', 'E-Size']) {
            await expect(page.getByText(name, {exact: true})).toBeVisible();
        }
        await expect(page.getByText('Scan', {exact: true})).toBeVisible();
        await expect(page.getByText('Filter', {exact: true})).toBeVisible();
        await planViews(page).getByRole('radio', {name: 'JSON', exact: true}).check();
        await expect(page.locator('.ydb-query-json-viewer')).toBeVisible();
        await mainViews(page).getByRole('radio', {name: 'Query Plan', exact: true}).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expect(mainViews(page).getByRole('radio', {name: 'AST', exact: true})).toBeFocused();
        await expect(page.getByText(/AST \(Abstract Syntax Tree\)/)).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(mainViews(page).getByText('AST', {exact: true})).not.toBeFocused();
        await mainViews(page).getByRole('radio', {name: 'AST', exact: true}).hover();
        await expect(page.getByText(/AST \(Abstract Syntax Tree\)/)).toBeVisible();
        await selectView(page, 'Query Plan');
        await planViews(page).getByRole('radio', {name: 'Table', exact: true}).check();
        for (const theme of ['light', 'dark']) {
            await page.evaluate((themeName) => {
                window.localStorage.setItem('theme', themeName);
            }, theme);
            await page.reload({waitUntil: 'domcontentloaded'});
            await editor.explain('SELECT 1;', 'query');
            await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
            await expect(page.locator('body')).toHaveClass(new RegExp(`g-root_theme_${theme}`));
            await page.screenshot({path: testInfo.outputPath(`query-plan-${theme}.png`)});
        }
        await page.getByRole('button', {name: 'Fullscreen', exact: true}).click();
        await expect(page.locator('.ydb-fullscreen_fullscreen')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('.ydb-fullscreen_fullscreen')).toHaveCount(0);
        await page.setViewportSize({width: 1000, height: 800});
        await expect(
            page.getByRole('button', {name: 'Diagnostics .JSON', exact: true}),
        ).toBeVisible();
        const controls = page.locator('.ydb-query-result__controls');
        expect(
            await controls.evaluate((element) => element.scrollWidth <= element.clientWidth),
        ).toBe(true);
        const layout = await controls.evaluate((element) => {
            const right = element.querySelector('.ydb-query-result__controls-right');
            return {
                header: element.getBoundingClientRect().toJSON(),
                right: right?.getBoundingClientRect().toJSON(),
                flexShrink: getComputedStyle(element).flexShrink,
            };
        });
        await testInfo.attach('header-layout.json', {
            body: JSON.stringify(layout),
            contentType: 'application/json',
        });
        expect(layout.right?.bottom).toBeLessThanOrEqual(layout.header.bottom);
        await page.screenshot({path: testInfo.outputPath('query-plan-narrow.png')});
    });
    test('matches Figma plan controls and table density', async ({page}, testInfo) => {
        await page.setViewportSize({width: 1440, height: 900});
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        const editor = await openEditor(page);
        await page.route(queryUrl, (route) => route.fulfill({json: makeResponse()}));
        await editor.explain('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        for (const name of ['Table', 'Graph', 'JSON']) {
            await expect(
                planViews(page).getByText(name, {exact: true}).locator('..').locator('svg.g-icon'),
            ).toBeVisible();
        }
        const firstRow = page.locator('.ydb-query-simplified-plan tbody tr').first();
        expect((await firstRow.boundingBox())?.height).toBe(30);
        await page.screenshot({path: testInfo.outputPath('figma-table.png')});
        for (const name of ['Graph', 'JSON']) {
            await planViews(page).getByRole('radio', {name, exact: true}).check();
            await page.screenshot({path: testInfo.outputPath(`figma-${name.toLowerCase()}.png`)});
        }
        await analyze(editor);
        await selectView(page, 'Stats');
        await expect(page.getByPlaceholder('Search...')).toBeVisible();
        await page.screenshot({path: testInfo.outputPath('figma-stats.png')});
        await mainViews(page).getByRole('radio', {name: 'Result 1', exact: true}).check();
        await expect(page.getByText('2 rows/s', {exact: true})).toBeVisible();
        await page.screenshot({path: testInfo.outputPath('figma-result.png')});
        expect(
            await page
                .locator('.ydb-query-result__controls-left')
                .evaluate((element) => getComputedStyle(element).gap),
        ).toBe('8px');
    });
    test('reads formatted result counts without losing thousands', async ({page}) => {
        const editor = await openEditor(page);
        const response = makeResponse();
        response.resultSets[0].result = Array.from({length: 1000}, (_, value) => ({value}));
        response.stats.Executions[0].ResultRows = '1000';
        await page.route(queryUrl, (route) => route.fulfill({json: response}));
        await analyze(editor);
        await mainViews(page).getByRole('radio', {name: 'Result 1', exact: true}).check();
        await expect(page.locator('.ydb-query-result-sets-viewer__title')).toContainText(
            '1\u00a0000',
        );
        await expect(editor.resultTable.getResultTitleCount()).resolves.toBe('1000');
    });
});
