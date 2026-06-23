import {expect, test} from '@playwright/test';
import type {Route} from '@playwright/test';

import {MAX_QUERY_TIMEOUT_SECONDS, QUERY_MODES} from '../../../../src/utils/query';
import {backend} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {VISIBILITY_TIMEOUT} from '../TenantPage';

import {ButtonNames, QueryEditor} from './models/QueryEditor';
import {setupQuerySettingsPage} from './querySettings.helpers';

test.describe('Query Settings timeout', () => {
    test.beforeEach(async ({page}) => {
        await setupQuerySettingsPage(page);
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

    test('Shows error for timeout exceeding maximum', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Enable timeout
        await queryEditor.settingsDialog.clickTimeoutSwitch();
        await expect(queryEditor.settingsDialog.isTimeoutInputVisible()).resolves.toBe(true);

        // Enter a value exceeding MAX_QUERY_TIMEOUT_SECONDS
        await queryEditor.settingsDialog.changeTimeout(MAX_QUERY_TIMEOUT_SECONDS + 1);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Dialog should stay open with validation error
        await expect(queryEditor.settingsDialog.isTimeoutError()).resolves.toBe(true);

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
    });

    test('Shows error for negative timeout', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Enable timeout
        await queryEditor.settingsDialog.clickTimeoutSwitch();
        await expect(queryEditor.settingsDialog.isTimeoutInputVisible()).resolves.toBe(true);

        // Enter a negative value
        await queryEditor.settingsDialog.changeTimeout(-10);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Dialog should stay open with validation error
        await expect(queryEditor.settingsDialog.isTimeoutError()).resolves.toBe(true);

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
    });

    test('Accepts timeout at exactly MAX_QUERY_TIMEOUT_SECONDS', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Enable timeout
        await queryEditor.settingsDialog.clickTimeoutSwitch();
        await expect(queryEditor.settingsDialog.isTimeoutInputVisible()).resolves.toBe(true);

        // Enter exactly the max value
        await queryEditor.settingsDialog.changeTimeout(MAX_QUERY_TIMEOUT_SECONDS);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Dialog should close (no error)
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);

        // Reopen and verify value persisted
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.getTimeoutValue()).resolves.toBe(
            MAX_QUERY_TIMEOUT_SECONDS.toString(),
        );

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
    });

    test('Persists valid timeout value', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const validTimeout = 300;

        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Enable timeout and set value
        await queryEditor.settingsDialog.clickTimeoutSwitch();
        await queryEditor.settingsDialog.changeTimeout(validTimeout);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);

        // Reopen and verify
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.getTimeoutValue()).resolves.toBe(
            validTimeout.toString(),
        );

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
    });

    test('Timeout in seconds is sent as milliseconds in API request and omitted when disabled', async ({
        page,
    }) => {
        const capturedBodies: Array<Record<string, unknown>> = [];

        await page.route(`${backend}/viewer/json/query?*`, async (route: Route) => {
            const request = route.request();
            const postData = request.postData();

            if (!postData) {
                await route.continue();
                return;
            }

            if (postData.includes('.sys/resource_pools')) {
                await route.continue();
                return;
            }

            const body = JSON.parse(postData) as Record<string, unknown>;
            capturedBodies.push(body);

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    version: 8,
                    result: [
                        {
                            rows: [],
                            columns: [],
                        },
                    ],
                }),
            });
        });

        const queryEditor = new QueryEditor(page);
        const timeoutSeconds = 120;

        // Switch to scan mode (non-streaming, timeout always enabled) and set timeout
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.scan);
        await queryEditor.settingsDialog.changeTimeout(timeoutSeconds);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Run a query
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        // Verify timeout is sent as milliseconds
        await expect(async () => {
            expect(capturedBodies.length).toBeGreaterThan(0);

            const lastBody = capturedBodies[capturedBodies.length - 1] as {
                query?: string;
                timeout?: number;
            };

            expect(lastBody.query).toContain('SELECT 1;');
            expect(lastBody.timeout).toBe(timeoutSeconds * 1000);
        }).toPass({timeout: VISIBILITY_TIMEOUT});

        // Clear timeout and run another query
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.clearTimeout();
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await queryEditor.setQuery('SELECT 2;');
        await queryEditor.clickRunButton();

        // Verify timeout is omitted from the request
        await expect(async () => {
            const lastBody = capturedBodies[capturedBodies.length - 1] as {
                query?: string;
                timeout?: number;
            };

            expect(lastBody.query).toContain('SELECT 2;');
            expect(lastBody.timeout).toBeUndefined();
        }).toPass({timeout: VISIBILITY_TIMEOUT});
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
