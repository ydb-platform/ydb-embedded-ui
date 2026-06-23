import {expect, test} from '@playwright/test';

import {ButtonNames, QueryEditor} from './models/QueryEditor';
import {setupQuerySettingsPage} from './querySettings.helpers';

test.describe('Query Settings limit rows', () => {
    test.beforeEach(async ({page}) => {
        await setupQuerySettingsPage(page);
    });

    test('Shows error for limit rows > 100000', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeLimitRows(100001);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await expect(queryEditor.settingsDialog.isLimitRowsError()).resolves.toBe(true);
        await expect(queryEditor.settingsDialog.getLimitRowsErrorMessage()).resolves.toBe(
            'Number must be less than or equal to 100000',
        );
    });

    test('Shows error for negative limit rows', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeLimitRows(-1);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await expect(queryEditor.settingsDialog.isLimitRowsError()).resolves.toBe(true);
        await expect(queryEditor.settingsDialog.getLimitRowsErrorMessage()).resolves.toBe(
            'Number must be greater than 0',
        );
    });

    test('Persists valid limit rows value', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const validValue = 50000;

        // Set value and save
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(validValue);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);

        // Reopen and check value
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.getLimitRowsValue()).resolves.toBe(
            validValue.toString(),
        );
    });

    test('Allows empty limit rows value', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.clearLimitRows();
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
    });
});
