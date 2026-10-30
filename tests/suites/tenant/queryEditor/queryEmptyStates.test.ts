import {expect, test} from '@playwright/test';

import {backend, database} from '../../../utils/constants';
import {toggleEditorSetting} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';

import {ButtonNames} from './models/QueryEditor';

test.describe('Query empty states @query-editor-redesign', () => {
    for (const theme of ['light', 'dark']) {
        for (const {mode, view, title, lines} of [
            {mode: 'none', view: 'Stats', title: 'Statistics not enabled', lines: 2},
            {mode: 'basic', view: 'Query Plan', title: 'Query plan not enabled', lines: 3},
        ] as const) {
            test(`${view} description uses Body 1 in ${theme} theme`, async ({page}, testInfo) => {
                await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
                await page.setViewportSize({width: 1440, height: 900});
                const tenant = new TenantPage(page);
                await tenant.gotoQueryEditor({schema: database, database});
                const editor = tenant.queryEditor;
                await toggleEditorSetting(page, 'off', 'Query Streaming');
                let requests = 0;
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
                const description = placeholder.locator('.g-placeholder-container__description');
                await expect.soft(description).toHaveCSS('font-size', '13px');
                await expect.soft(description).toHaveCSS('line-height', '18px');
                await expect.soft(description).toHaveCSS('font-weight', '400');
                expect
                    .soft(
                        await description.evaluate(
                            (element) => getComputedStyle(element).fontFamily,
                        ),
                    )
                    .toContain('Inter');
                await expect.soft(description).toHaveCSS('height', `${lines * 18}px`);
                await page.mouse.move(5, 5);
                await placeholder.screenshot({path: testInfo.outputPath('empty-state.png')});
                await placeholder
                    .getByRole('button', {name: 'Open query settings', exact: true})
                    .press('Enter');
                await expect(page.locator('.ydb-query-settings-dialog')).toBeVisible();
                expect(requests).toBe(1);
            });
        }
    }
});
