import {expect, test} from '@playwright/test';

import {QUERY_MODES, TRANSACTION_MODES} from '../../../../src/utils/query';
import {tenantName} from '../../../utils/constants';
import {TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {longRunningQuery} from '../constants';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

test.describe('Test Query Settings', async () => {
    const testQuery = 'SELECT 1, 2, 3, 4, 5;';

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            general: 'query',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Settings dialog opens on Gear click and closes on Cancel', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
    });

    test('Settings dialog saves changes and updates Gear button', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.scan);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await expect(async () => {
            const text = await queryEditor.gearButtonText();
            expect(text).toContain('(1)');
        }).toPass({timeout: VISIBILITY_TIMEOUT});
    });

    test('Banner appears after executing script with changed settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Change a setting
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.scan);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Execute a script
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        // Check if banner appears
        await expect(queryEditor.isBannerVisible()).resolves.toBe(true);
    });

    test('Banner not appears for running query', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Change a setting
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.scan);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Execute a script
        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(500);

        // Check if banner appears
        await expect(queryEditor.isBannerHidden()).resolves.toBe(true);
    });

    test('Gear button shows number of changed settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.scan);
        await queryEditor.settingsDialog.changeTransactionMode(TRANSACTION_MODES.snapshot);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await expect(async () => {
            const text = await queryEditor.gearButtonText();
            expect(text).toContain('(2)');
        }).toPass({timeout: VISIBILITY_TIMEOUT});
    });

    test('Banner does not appear when executing script with default settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isBannerHidden()).resolves.toBe(true);
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
