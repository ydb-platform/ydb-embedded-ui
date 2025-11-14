import {expect, test} from '@playwright/test';

import {QUERY_MODES, TRANSACTION_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {longRunningQuery} from '../constants';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

test.describe('Test Query Settings', async () => {
    const testQuery = 'SELECT 1, 2, 3, 4, 5;';

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
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

    test('Timeout input is invisible by default', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Open settings dialog
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Check that timeout input is invisible
        await expect(queryEditor.settingsDialog.isTimeoutInputVisible()).resolves.toBe(false);

        // Close dialog
        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
    });

    test('Clicking timeout switch makes timeout input visible', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Open settings dialog
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Initially timeout input should be invisible
        await expect(queryEditor.settingsDialog.isTimeoutInputVisible()).resolves.toBe(false);

        // Click the timeout switch
        await queryEditor.settingsDialog.clickTimeoutSwitch();

        // Check that timeout input is now visible
        await expect(queryEditor.settingsDialog.isTimeoutInputVisible()).resolves.toBe(true);
        await expect(queryEditor.settingsDialog.isTimeoutSwitchChecked()).resolves.toBe(true);

        // Close dialog
        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
    });

    test('Timeout switch is checked, disabled, and has hint when non-query mode is selected', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);

        // Open settings dialog
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Initially timeout switch should be enabled and unchecked
        await expect(queryEditor.settingsDialog.isTimeoutSwitchDisabled()).resolves.toBe(false);
        await expect(queryEditor.settingsDialog.isTimeoutSwitchChecked()).resolves.toBe(false);

        // Change to a non-query mode
        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.scan);

        // Verify timeout switch is checked and disabled
        await expect(queryEditor.settingsDialog.isTimeoutSwitchChecked()).resolves.toBe(true);
        await expect(queryEditor.settingsDialog.isTimeoutSwitchDisabled()).resolves.toBe(true);

        // Verify hint is visible and has correct text
        await expect(queryEditor.settingsDialog.isTimeoutHintVisible()).resolves.toBe(true);

        // Verify the hint text content
        const hintText = await queryEditor.settingsDialog.getTimeoutHintText();
        expect(hintText).toBeTruthy(); // Should have some text content

        // Hover some other input to remove the hint
        await queryEditor.settingsDialog.hoverStatisticsSelect();
        await page.waitForTimeout(500);

        // Close dialog
        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
    });

    test('When Query Streaming is off, timeout has label and input is visible by default', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);

        // Turn off Query Streaming experiment
        await toggleExperiment(page, 'off', 'Query Streaming');

        // Open settings dialog
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Verify there's a label instead of a switch
        await expect(queryEditor.settingsDialog.isTimeoutLabelVisible()).resolves.toBe(true);

        // Verify timeout input is visible by default
        await expect(queryEditor.settingsDialog.isTimeoutInputVisible()).resolves.toBe(true);

        // Close dialog
        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);

        // Restore Query Streaming experiment
        await toggleExperiment(page, 'on', 'Query Streaming');
    });
});
