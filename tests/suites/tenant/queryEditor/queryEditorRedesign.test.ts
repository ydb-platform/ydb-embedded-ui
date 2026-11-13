import {readFile} from 'node:fs/promises';

import {expect, test} from '@playwright/test';
import type {Download, Page, Route} from '@playwright/test';
import {colord} from 'colord';

import {backend, database} from '../../../utils/constants';
import {toggleEditorSetting} from '../../../utils/toggleExperiment';
import {Sidebar} from '../../sidebar/Sidebar';
import {TenantPage} from '../TenantPage';

import {ButtonNames} from './models/QueryEditor';
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
                Operators: [{Name: 'Scan', 'A-Rows': 0, 'E-Rows': 2, 'E-Cost': null, 'E-Size': ''}],
                Plans: [{'Node Type': 'Filter', Operators: [{Name: 'Filter', 'A-Cpu': 0}]}],
            },
        ],
    },
};
const makeResponse = () => ({
    plan,
    ast: '(return (Int32 1))',
    result: [{columns: [{name: 'value', type: 'Int32'}], rows: [[1]], truncated: false}],
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
async function trackSvgUrls(page: Page) {
    return page.evaluateHandle(() => {
        const urls = {created: [] as string[], revoked: [] as string[]};
        const create = URL.createObjectURL.bind(URL);
        const revoke = URL.revokeObjectURL.bind(URL);
        URL.createObjectURL = (blob) => {
            const url = create(blob);
            if (blob instanceof Blob && ['image/svg+xml', 'text/html'].includes(blob.type)) {
                urls.created.push(url);
            }
            return url;
        };
        URL.revokeObjectURL = (url) => {
            if (urls.created.includes(url)) {
                urls.revoked.push(url);
            }
            revoke(url);
        };
        return urls;
    });
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

test.describe('Query editor regressions @query-editor-redesign', () => {
    test('resizes columns locally and resets widths for another view or result', async ({page}) => {
        const editor = await openEditor(page);
        await page.route(queryUrl, (route) => route.fulfill({json: makeResponse()}));
        await editor.explain('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        const headers = page.locator('.ydb-query-simplified-plan th');
        const cells = page.locator('.ydb-query-simplified-plan tbody tr').first().locator('td');
        await expect(cells.nth(2)).toHaveText('0');
        await expect(cells.nth(3)).toHaveText('');
        await expect(headers.first()).toHaveCSS('font-weight', '500');
        await expect(headers.first()).toHaveCSS('height', '40px');
        await expect(cells.first()).toHaveCSS('height', '30px');
        const widths = () =>
            headers.evaluateAll((elements) =>
                elements.map((element) => element.getBoundingClientRect().width),
            );
        await page.setViewportSize({width: 1440, height: 900});
        const before = await widths();
        await page.setViewportSize({width: 1640, height: 900});
        await expect.poll(async () => (await widths())[0]).toBeGreaterThan(before[0]);
        expect((await widths()).slice(1)).toEqual([89, 89, 89, 89, 85]);
        const resizeMetric = async () => {
            const handle = headers.nth(1).locator('.gt-resize-handle');
            await handle.hover();
            const box = await handle.boundingBox();
            if (!box) {
                throw new Error('Missing column resize handle');
            }
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, {steps: 4});
            await expect.poll(async () => (await widths())[1]).toBe(129);
            await page.mouse.up();
        };
        await resizeMetric();
        const manual = await widths();
        await page.setViewportSize({width: 1000, height: 800});
        expect(await widths()).toEqual(manual);
        expect(
            await page
                .locator('.ydb-query-simplified-plan')
                .evaluate((element) => element.scrollWidth > element.clientWidth),
        ).toBe(true);
        await editor.explain('SELECT 2;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        expect((await widths()).slice(1)).toEqual([89, 89, 89, 89, 85]);
        await resizeMetric();
        await headers.nth(1).locator('.gt-resize-handle').dblclick();
        expect((await widths())[1]).toBe(89);
        await resizeMetric();
        await selectView(page, 'AST');
        await selectView(page, 'Query Plan');
        expect((await widths()).slice(1)).toEqual([89, 89, 89, 89, 85]);
    });

    test('SVG viewing and download preserve theme, isolation and fullscreen controls', async ({
        page,
    }) => {
        await page.addInitScript(() => localStorage.setItem('theme', 'light'));
        const editor = await openEditor(page);
        const urls = await trackSvgUrls(page);
        const actions: string[] = [];
        let conversions = 0;
        const documentSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100">
            <text x="10" y="50" fill="var(--stage-text, #111)"><title>Stage details</title>Current plan</text>
            <script>document.documentElement.setAttribute("data-controls-ready", "true")</script>
            <image href="https://example.invalid/blocked" width="1" height="1" onerror="document.documentElement.setAttribute('data-network-blocked', 'true')"/>
        </svg>`;
        await page.route(queryUrl, (route) => {
            actions.push(route.request().postDataJSON().action);
            return route.fulfill({json: makeResponse()});
        });
        await page.route('**/plan2svg?*', (route) => {
            conversions++;
            return route.fulfill({contentType: 'image/svg+xml', body: documentSvg});
        });
        await editor.explain('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        await selectView(page, 'Execution Plan');
        const image = page.getByRole('img', {name: 'Execution Plan'});
        const open = page.getByRole('button', {name: 'Open in new tab', exact: true});
        await expect(image).toBeVisible();
        const lightSource = await image.getAttribute('src');
        expect((await urls.jsonValue()).created).toHaveLength(1);
        const sidebar = new Sidebar(page);
        await sidebar.clickSettings();
        await page.getByRole('radio', {name: 'Dark', exact: true}).check();
        await sidebar.closeDrawer();
        await expect(image).not.toHaveAttribute('src', lightSource || '');
        await expect.poll(async () => (await urls.jsonValue()).revoked).toContain(lightSource);
        expect((await urls.jsonValue()).created).toHaveLength(2);
        const displayed = await image.evaluate((element: HTMLImageElement) =>
            fetch(element.src).then((r) => r.text()),
        );
        const background = colord(
            await image.evaluate((element) =>
                getComputedStyle(element).getPropertyValue('--g-color-base-background').trim(),
            ),
        );
        let externalRequests = 0;
        await page.context().route('https://example.invalid/**', (route) => {
            externalRequests++;
            return route.abort();
        });
        const popupPromise = page.waitForEvent('popup');
        await open.click();
        const popup = await popupPromise;
        const darkViewer = popup.url();
        try {
            const nativeSvg = popup.frameLocator('iframe').locator('svg');
            await expect(nativeSvg.locator('title')).toHaveText('Stage details');
            await expect(nativeSvg).toHaveAttribute('data-controls-ready', 'true');
            await expect(nativeSvg).toHaveAttribute('data-network-blocked', 'true');
            await expect(nativeSvg).toHaveCSS('background-color', background.toRgbString());
            expect(await popup.evaluate(() => window.opener === null)).toBe(true);
            expect(
                await nativeSvg.evaluate(() => {
                    try {
                        return window.localStorage.length;
                    } catch {
                        return 'isolated';
                    }
                }),
            ).toBe('isolated');
            expect(externalRequests).toBe(0);
            const frameSource = await popup.locator('iframe').getAttribute('src');
            expect(decodeURIComponent(frameSource?.split(',').slice(1).join(',') || '')).toBe(
                displayed,
            );
        } finally {
            await popup.close();
            await page.bringToFront();
        }
        const reopenedPromise = page.waitForEvent('popup');
        await open.press('Enter');
        const reopened = await reopenedPromise;
        await expect(reopened.frameLocator('iframe').locator('svg')).toBeVisible();
        expect(reopened.url()).toBe(darkViewer);
        expect((await urls.jsonValue()).created).toHaveLength(3);
        await reopened.close();
        await page.bringToFront();
        const pixel = await image.evaluate(async (element: HTMLImageElement) => {
            await element.decode();
            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 100;
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('Missing canvas context');
            }
            context.fillStyle = '#fff';
            context.fillRect(0, 0, 500, 100);
            context.drawImage(element, 0, 0);
            return Array.from(context.getImageData(499, 99, 1, 1).data);
        });
        const {r, g, b} = background.toRgb();
        expect(pixel).toEqual([r, g, b, 255]);
        await page.setViewportSize({width: 1000, height: 720});
        await page.getByRole('button', {name: 'Fullscreen', exact: true}).click();
        const fullscreen = page.locator('.ydb-fullscreen_fullscreen');
        const close = fullscreen.locator('.ydb-fullscreen__close-button');
        const download = page.getByRole('button', {name: 'Download .SVG', exact: true});
        const downloadBounds = await download.boundingBox();
        const closeBounds = await close.boundingBox();
        if (!downloadBounds || !closeBounds) {
            throw new Error('Missing fullscreen controls');
        }
        expect(downloadBounds.x + downloadBounds.width).toBeLessThanOrEqual(closeBounds.x);
        const downloadPromise = page.waitForEvent('download');
        await download.click();
        const file = await downloadPromise;
        expect(file.suggestedFilename()).toBe('query-plan.svg');
        expect(await readDownload(file)).toBe(displayed);
        await expect(fullscreen).toBeVisible();
        await close.press('Escape');
        await expect(fullscreen).toHaveCount(0);
        const darkSource = await image.getAttribute('src');
        await selectView(page, 'Query Plan');
        await expect
            .poll(async () => (await urls.jsonValue()).revoked)
            .toEqual(expect.arrayContaining([darkSource, darkViewer]));
        await selectView(page, 'Execution Plan');
        await expect(image).toBeVisible();
        expect(actions).toEqual(['explain-query']);
        expect(conversions).toBe(1);
    });

    test('Plan-only fallback preserves explicit choices until the next execution', async ({
        page,
    }) => {
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        const editor = await openEditor(page);
        let hasTable = false;
        await page.route(queryUrl, (route) =>
            route.fulfill({
                json: hasTable
                    ? makeResponse()
                    : {...makeResponse(), plan: {meta: plan.meta, Plan: plan.Plan}},
            }),
        );
        await editor.explain('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        const views = planViews(page);
        await expect(views.getByRole('radio', {name: 'Graph', exact: true})).toBeChecked();
        await expect(
            page.locator('.ydb-gravity-graph__block-content').filter({hasText: 'ResultSet'}),
        ).toBeVisible();
        await views.getByRole('radio', {name: 'Table', exact: true}).check();
        await expect(
            page.getByText('There is no Query Plan for the request', {exact: true}),
        ).toBeVisible();
        await selectView(page, 'AST');
        await selectView(page, 'Query Plan');
        await expect(views.getByRole('radio', {name: 'Table', exact: true})).toBeChecked();
        await views.getByRole('radio', {name: 'JSON', exact: true}).check();
        const json = page.locator('.ydb-query-json-viewer');
        await expect(json.locator('.g-ru-cell__key').first()).toHaveCSS(
            'color',
            'rgb(156, 220, 254)',
        );
        await expect(json.locator('.g-ru-cell__value_type_string').first()).toHaveCSS(
            'color',
            'rgb(206, 145, 120)',
        );
        await expect(json.locator('.unipika').first()).toHaveCSS('color', 'rgb(128, 128, 128)');
        await selectView(page, 'AST');
        await selectView(page, 'Query Plan');
        await expect(views.getByRole('radio', {name: 'JSON', exact: true})).toBeChecked();
        await editor.clickExplainButton();
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(views.getByRole('radio', {name: 'Graph', exact: true})).toBeChecked();
        hasTable = true;
        await editor.clickExplainButton();
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(views.getByRole('radio', {name: 'Table', exact: true})).toBeChecked();
        await expect(page.locator('.ydb-query-simplified-plan th')).toHaveCount(6);
    });

    test('disabled plan opens settings without rerunning the query', async ({page}) => {
        const editor = await openEditor(page);
        await toggleEditorSetting(page, 'off', 'Query Streaming');
        await editor.clickGearButton();
        await editor.settingsDialog.changeStatsLevel('basic');
        await editor.settingsDialog.clickButton(ButtonNames.Save);
        let requests = 0;
        let conversions = 0;
        await page.route(queryUrl, (route) => {
            if (!route.request().postDataJSON().query?.includes('SELECT 1;')) {
                return route.continue();
            }
            requests++;
            return route.fulfill({json: {result: makeResponse().result}});
        });
        await page.route('**/plan2svg?*', (route) => {
            conversions++;
            return route.abort();
        });
        await editor.run('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        const placeholder = page.locator('.ydb-query-data-not-enabled');
        for (const section of ['Query Plan', 'Execution Plan']) {
            await selectView(page, section);
            await expect(
                placeholder.getByText('Query plan not enabled', {exact: true}),
            ).toBeVisible();
            await expect(planViews(page)).toHaveCount(0);
        }
        const description = placeholder.locator('.ydb-query-data-not-enabled__description');
        await expect(description).toContainText('Select Full mode');
        await expect(description).toHaveCSS('font-size', '13px');
        await expect(description).toHaveCSS('line-height', '18px');
        await expect(description).toHaveCSS('font-weight', '400');
        await placeholder
            .getByRole('button', {name: 'Open query settings', exact: true})
            .press('Enter');
        await expect(page.locator('.ydb-query-settings-dialog')).toBeVisible();
        expect(requests).toBe(1);
        expect(conversions).toBe(0);
        await editor.settingsDialog.changeStatsLevel('full');
        await editor.settingsDialog.clickButton(ButtonNames.Save);
        await expect(placeholder.getByText('Query plan not enabled', {exact: true})).toBeVisible();
        expect(requests).toBe(1);
        await editor.run('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        await selectView(page, 'Query Plan');
        await expect(placeholder).toHaveCount(0);
        await expect(
            page.getByText('There is no Query Plan for the request', {exact: true}),
        ).toBeVisible();
        expect(requests).toBe(2);
    });

    test('Analyze keeps parsed result sets, truncation and diagnostics', async ({page}) => {
        const editor = await openEditor(page);
        const response = makeResponse();
        await page.route(queryUrl, (route) => route.fulfill({json: response}));
        await analyze(editor);
        await selectView(page, 'Result 1');
        await expect(editor.resultTable.getCellValue(1, 2)).resolves.toBe('1');
        await expect(page.getByText('2 result rows/s', {exact: true})).toBeVisible();
        response.result[0].truncated = true;
        await analyze(editor);
        await selectView(page, 'Result 1');
        await expect(page.getByText('Truncated', {exact: true})).toBeVisible();
        await expect(page.getByText(/rows\/s/)).toHaveCount(0);
        response.result[0].truncated = false;
        response.result.push({
            columns: [{name: 'value', type: 'Int32'}],
            rows: [[2]],
            truncated: false,
        });
        await analyze(editor);
        await selectView(page, 'Result 2');
        await expect(page.getByText(/rows\/s/)).toHaveCount(0);
        await page.getByRole('tab', {name: /Result #2/}).click();
        await expect(editor.resultTable.getCellValue(1, 2)).resolves.toBe('2');
        const download = page.waitForEvent('download');
        await page.getByRole('button', {name: 'Diagnostics .JSON', exact: true}).click();
        expect(JSON.parse(await readDownload(await download))).toEqual({
            database,
            queryText: 'SELECT 1;',
            ast: response.ast,
            stats: response.stats,
            plan,
        });
        const error = {error: {message: 'Query failed in diagnostics test'}, issues: []};
        await page.route(queryUrl, (route) => route.fulfill({json: error}));
        await toggleEditorSetting(page, 'off', 'Query Streaming');
        await editor.run('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Failed')).resolves.toBe(true);
        const failedDownload = page.waitForEvent('download');
        await page.getByRole('button', {name: 'Diagnostics .JSON', exact: true}).click();
        expect(JSON.parse(await readDownload(await failedDownload))).toEqual({
            database,
            queryText: 'SELECT 1;',
            error,
        });
    });

    test('mocked SVG failure retries and a late response cannot replace the next execution', async ({
        page,
    }) => {
        const editor = await openEditor(page);
        const urls = await trackSvgUrls(page);
        // The second database is synthetic; bootstrap reads reuse the existing test database.
        await page.route(`${backend}/viewer/json/**`, (route) => {
            const url = new URL(route.request().url());
            for (const key of ['database', 'path']) {
                if (url.searchParams.get(key) === '/other') {
                    url.searchParams.set(key, database);
                }
            }
            return route.continue({url: url.toString()});
        });
        let queryNumber = 0;
        await page.route(queryUrl, (route) =>
            route.fulfill({
                json: {...makeResponse(), plan: {...plan, tables: [{name: String(++queryNumber)}]}},
            }),
        );
        let held: Route | undefined;
        let conversion = 0;
        const conversionDatabases: Array<string | null> = [];
        await page.route('**/plan2svg?*', async (route) => {
            conversion += 1;
            conversionDatabases.push(new URL(route.request().url()).searchParams.get('database'));
            if (conversion === 1) {
                await route.fulfill({status: 400, body: 'Conversion failed'});
            } else if (conversion === 2) {
                await route.fulfill({contentType: 'image/svg+xml', body: '<svg><broken></svg>'});
            } else if (conversion === 3) {
                held = route;
            } else {
                await route.fulfill({contentType: 'image/svg+xml', body: svg});
            }
        });
        await analyze(editor);
        await selectView(page, 'Execution Plan');
        await expect(page.locator('.ydb-execution-plan__error').getByRole('alert')).toBeVisible();
        await page.getByRole('button', {name: 'Retry', exact: true}).click();
        await expect(
            page.getByText('The execution plan could not be displayed', {exact: true}),
        ).toBeVisible();
        expect((await urls.jsonValue()).created).toHaveLength(0);
        await page.getByRole('button', {name: 'Retry', exact: true}).click();
        await expect.poll(() => Boolean(held)).toBe(true);
        await selectView(page, 'Query Plan');
        await page.evaluate(() => {
            const url = new URL(location.href);
            url.searchParams.set('database', '/other');
            history.pushState({}, '', url);
            dispatchEvent(new PopStateEvent('popstate'));
        });
        await editor.waitForEditorReady();
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
        expect(conversionDatabases).toEqual([database, database, database, '/other']);
        const failedSource = await image.getAttribute('src');
        await image.dispatchEvent('error');
        await expect(
            page.getByText('The execution plan could not be displayed', {exact: true}),
        ).toBeVisible();
        await page.getByRole('button', {name: 'Retry', exact: true}).click();
        await expect(image).toBeVisible();
        await expect(image).not.toHaveAttribute('src', failedSource || '');
        await expect.poll(async () => (await urls.jsonValue()).revoked).toContain(failedSource);
        expect(conversion).toBe(5);
    });

    test('AST tooltip closes after mouse leave and stays available to keyboard', async ({page}) => {
        const editor = await openEditor(page);
        await page.route(queryUrl, (route) => route.fulfill({json: makeResponse()}));
        await editor.explain('SELECT 1;', 'query');
        await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
        await mainViews(page).getByRole('radio', {name: 'AST', exact: true}).click();
        await expect(page.getByText(/AST \(Abstract Syntax Tree\)/)).toBeVisible();
        await page.mouse.move(0, 0);
        await expect(page.getByText(/AST \(Abstract Syntax Tree\)/)).toBeHidden();
        await selectView(page, 'Query Plan');
        await mainViews(page).getByRole('radio', {name: 'Query Plan', exact: true}).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expect(mainViews(page).getByRole('radio', {name: 'AST', exact: true})).toBeFocused();
        await expect(page.getByText(/AST \(Abstract Syntax Tree\)/)).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(mainViews(page).getByText('AST', {exact: true})).not.toBeFocused();
        await mainViews(page).getByRole('radio', {name: 'AST', exact: true}).hover();
        await expect(page.getByText(/AST \(Abstract Syntax Tree\)/)).toBeVisible();
    });
});
