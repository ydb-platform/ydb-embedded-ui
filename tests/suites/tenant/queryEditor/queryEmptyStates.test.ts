import {expect, test} from '@playwright/test';

import {backend, database} from '../../../utils/constants';
import {toggleEditorSetting} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';

import {ButtonNames} from './models/QueryEditor';

test.describe('Query empty states @query-editor-redesign', () => {
    for (const theme of ['light', 'dark']) {
        for (const {mode, view, title, lines, hint} of [
            {
                mode: 'none',
                view: 'Stats',
                title: 'Statistics not enabled',
                lines: 2,
                hint: 'Select Basic or Full mode',
            },
            {
                mode: 'basic',
                view: 'Query Plan',
                title: 'Query plan not enabled',
                lines: 3,
                hint: 'Select Full mode',
            },
        ] as const) {
            test(`${view} description uses Body 1 in ${theme} theme`, async ({page}) => {
                await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
                await page.setViewportSize({width: 1440, height: 900});
                const tenant = new TenantPage(page);
                await tenant.gotoQueryEditor({schema: database, database});
                const editor = tenant.queryEditor;
                await toggleEditorSetting(page, 'off', 'Query Streaming');
                let requests = 0;
                let conversions = 0;
                await page.route('**/plan2svg?*', (route) => {
                    conversions++;
                    return route.abort();
                });
                await page.route(`${backend}/viewer/json/query?*`, (route) => {
                    requests++;
                    return route.fulfill({
                        json: {
                            result: [{columns: [{name: 'value', type: 'Int32'}], rows: [[1]]}],
                        },
                    });
                });
                await editor.clickGearButton();
                await editor.settingsDialog.changeStatsLevel(mode);
                await editor.settingsDialog.clickButton(ButtonNames.Save);
                await editor.run('SELECT 1;', 'query');
                await expect(editor.waitForStatus('Completed')).resolves.toBe(true);
                await page
                    .locator('.ydb-query-result__controls-left')
                    .getByRole('radio', {name: view, exact: true})
                    .check();
                const placeholder = page.locator('.ydb-query-data-not-enabled');
                await expect(placeholder.getByText(title, {exact: true})).toBeVisible();
                await expect(page.locator('.ydb-query-plan__switcher')).toHaveCount(0);
                await expect(placeholder).toHaveCSS('filter', 'none');
                const description = placeholder.locator('.g-placeholder-container__description');
                await expect(description).toContainText(hint);
                await expect.soft(description).toHaveCSS('font-size', '13px');
                await expect.soft(description).toHaveCSS('line-height', '18px');
                await expect.soft(description).toHaveCSS('font-weight', '400');
                const emphasizedModes = view === 'Stats' ? ['Basic', 'Full'] : ['Full'];
                const emphasis = description.locator('strong');
                await expect.soft(emphasis).toHaveText(emphasizedModes);
                for (const mode of emphasizedModes) {
                    await expect
                        .soft(emphasis.filter({hasText: mode}))
                        .toHaveCSS('font-weight', '700');
                    await expect
                        .soft(emphasis.filter({hasText: mode}))
                        .toHaveCSS('line-height', '18px');
                }
                expect
                    .soft(await description.textContent())
                    .toContain(view === 'Stats' ? 'or\u00a0Full' : 'to\u00a0collect');
                await expect.soft(description).toHaveCSS('height', `${lines * 18}px`);
                await page.mouse.move(5, 5);
                const views = page.locator('.ydb-query-result__controls-left');
                await views.getByRole('radio', {name: 'Execution Plan', exact: true}).check();
                await expect(
                    page.getByText('There is no execution plan for this query', {exact: true}),
                ).toBeVisible();
                expect(conversions).toBe(0);
                await views.getByRole('radio', {name: view, exact: true}).check();
                await placeholder
                    .getByRole('button', {name: 'Open query settings', exact: true})
                    .press('Enter');
                await expect(page.locator('.ydb-query-settings-dialog')).toBeVisible();
                expect(requests).toBe(1);
                await editor.settingsDialog.changeStatsLevel('full');
                await editor.settingsDialog.clickButton(ButtonNames.Save);
                await expect(placeholder.getByText(title, {exact: true})).toBeVisible();
                expect(requests).toBe(1);
                await editor.run('SELECT 1;', 'query');
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
    }
});
