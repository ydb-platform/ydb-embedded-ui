import {expect, test} from '@playwright/test';
import type {Page, Route} from '@playwright/test';

import {
    DEFAULT_QUERY_SETTINGS,
    MAX_QUERY_TIMEOUT_SECONDS,
    QUERY_MODES,
    TRANSACTION_MODES,
} from '../../../../src/utils/query';
import {backend, database} from '../../../utils/constants';
import {toggleEditorSetting} from '../../../utils/toggleExperiment';
import {TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {longRunningQuery} from '../constants';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

async function fulfillResourcePools(route: Route, pools: string[]) {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            version: 8,
            result: [
                {
                    rows: pools.map((name) => [name]),
                    columns: [{name: 'Name', type: 'Utf8?'}],
                },
            ],
        }),
    });
}

async function setupResourcePoolMock(page: Page, pools: string[] = ['default', 'olap']) {
    await page.route(`${backend}/viewer/json/query?*`, async (route: Route) => {
        const request = route.request();
        const postData = request.postData();

        if (postData && postData.includes('.sys/resource_pools')) {
            await fulfillResourcePools(route, pools);
        } else {
            await route.continue();
        }
    });
}

test.describe('Test Query Settings', async () => {
    const testQuery = 'SELECT 1, 2, 3, 4, 5;';

    test.beforeEach(async ({page}) => {
        await setupResourcePoolMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.gotoQueryEditor({
            schema: database,
            database,
        });
    });

    test('Settings dialog discards cancelled drafts and persists applied statistics', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);
        await expect(queryEditor.settingsDialog.selectedStatsLevel).toHaveAccessibleName('Full');
        const advanced = page.getByRole('button', {name: 'Advanced settings', exact: true});
        await expect(advanced).toHaveAttribute('aria-expanded', 'false');
        await queryEditor.settingsDialog.expandAdvanced();
        const tracingLabel = page.getByText('Tracing', {exact: true});
        const tracing = page.getByRole('switch', {name: 'Tracing', exact: true});
        await tracingLabel.click();
        await expect(tracing).toBeChecked();
        await tracingLabel.click();
        await expect(tracing).not.toBeChecked();
        await queryEditor.settingsDialog.changeStatsLevel('none');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);

        await queryEditor.clickGearButton();
        await expect(advanced).toHaveAttribute('aria-expanded', 'false');
        await expect(queryEditor.settingsDialog.selectedStatsLevel).toHaveAccessibleName('Full');
        await queryEditor.settingsDialog.changeStatsLevel('none');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
        await page.reload();
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.selectedStatsLevel).toHaveAccessibleName('None');
    });

    test('Settings dialog saves changes and updates Gear button', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.expandAdvanced();
        await page.getByRole('combobox', {name: 'Query type', exact: true}).click();
        const options = page.getByRole('option');
        await expect(options).toHaveCount(4);
        for (const option of await options.all()) {
            await expect(option).toHaveAccessibleName(/\S/);
        }
        await page.getByRole('option', {name: 'Scan Legacy', exact: true}).click();
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

        await expect(async () => {
            const text = await queryEditor.gearButtonText();
            expect(text).toContain('(1)');
        }).toPass({timeout: VISIBILITY_TIMEOUT});
    });

    test('Gear uses the same ActionTooltip style as Explain Analyze', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.scan);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await queryEditor.hoverGearButton();

        const settingsActionTooltip = page
            .locator('.g-action-tooltip')
            .filter({hasText: 'Query execution settings have been changed'});

        await expect(settingsActionTooltip).toBeVisible();
        await expect(
            settingsActionTooltip.getByText('Query type: Scan', {exact: true}),
        ).toBeVisible();
    });

    test('Banner appears after executing script with changed settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Change a setting
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.scan);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

        await expect(queryEditor.settingsDialog.isLimitRowsError()).resolves.toBe(true);
        await expect(queryEditor.settingsDialog.getLimitRowsErrorMessage()).resolves.toBe(
            'Too big: expected number to be <=100000',
        );
    });

    test('Shows error for negative limit rows', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeLimitRows(-1);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

        await expect(queryEditor.settingsDialog.isLimitRowsError()).resolves.toBe(true);
        await expect(queryEditor.settingsDialog.getLimitRowsErrorMessage()).resolves.toBe(
            'Too small: expected number to be >0',
        );
    });

    test('Persists limit rows without replacing a saved snapshot transaction mode', async ({
        page,
    }) => {
        await page.evaluate(
            (settings) => localStorage.setItem('queryExecutionSettings', JSON.stringify(settings)),
            {...DEFAULT_QUERY_SETTINGS, transactionMode: TRANSACTION_MODES.snapshotrw},
        );
        await Promise.all([
            page.waitForResponse((response) => response.url().includes('/viewer/capabilities')),
            page.reload(),
        ]);
        const queryEditor = new QueryEditor(page);
        const validValue = 50000;
        const transactionMode = page.getByRole('combobox', {name: 'Transaction mode', exact: true});

        await queryEditor.clickGearButton();
        await expect(transactionMode).toContainText('Snapshot Read-Write');
        await queryEditor.settingsDialog.changeLimitRows(validValue);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);

        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.getLimitRowsValue()).resolves.toBe(
            validValue.toString(),
        );
        await expect(transactionMode).toContainText('Snapshot Read-Write');
        await queryEditor.settingsDialog.changeTransactionMode(TRANSACTION_MODES.serializable);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
        await queryEditor.clickGearButton();
        await transactionMode.click();
        await expect(page.getByRole('option', {name: /Snapshot Read-Write/})).toHaveCount(0);
    });

    test('Allows empty limit rows value', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.clearLimitRows();
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

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

    test('Shows error for timeout exceeding maximum', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        // Enable timeout
        await queryEditor.settingsDialog.clickTimeoutSwitch();
        await expect(queryEditor.settingsDialog.isTimeoutInputVisible()).resolves.toBe(true);

        // Enter a value exceeding MAX_QUERY_TIMEOUT_SECONDS
        await queryEditor.settingsDialog.changeTimeout(MAX_QUERY_TIMEOUT_SECONDS + 1);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

        // Dialog should stay open with validation error
        await expect(queryEditor.settingsDialog.isTimeoutError()).resolves.toBe(true);

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
    });

    test('Apply reveals and focuses an invalid field in collapsed advanced settings', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.expandAdvanced();
        const chunkSize = page.getByRole('spinbutton', {name: 'Output chunk max size'});
        await chunkSize.pressSequentially('1e');
        await page.getByRole('button', {name: 'Advanced settings'}).click();
        await expect(chunkSize).toBeHidden();
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await expect(chunkSize).toBeFocused();
        await chunkSize.fill('1024');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);

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

        // Turn off Query Streaming
        await toggleEditorSetting(page, 'off', 'Query Streaming');

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

        // Restore Query Streaming
        await toggleEditorSetting(page, 'on', 'Query Streaming');
    });

    test('Resource pool dropdown is populated from system view', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        const options = await queryEditor.settingsDialog.getResourcePoolOptions();

        expect(options).toContain('No pool override');
        expect(options).toContain('default');
        expect(options).toContain('olap');
    });

    test('Resource pool selection is persisted between dialog opens', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeResourcePool('olap');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);

        await queryEditor.clickGearButton();
        const value = await queryEditor.settingsDialog.getResourcePoolValue();

        expect(value).toBe('olap');
    });

    test('Selected resource pool is sent in API requests and no override omits parameter', async ({
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
                await fulfillResourcePools(route, ['default', 'olap']);
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

        await page.route(`${backend}/viewer/query?*`, async (route: Route) => {
            const request = route.request();
            const postData = request.postData();

            if (!postData) {
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

        // Select a concrete resource pool and run a query
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeResourcePool('olap');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        await expect(async () => {
            expect(capturedBodies.length).toBeGreaterThan(0);

            const lastBody = capturedBodies[capturedBodies.length - 1] as {
                query?: string;
                resource_pool?: string;
            };

            expect(lastBody.query).toContain('SELECT 1;');
            expect(lastBody.resource_pool).toBe('olap');
        }).toPass({timeout: VISIBILITY_TIMEOUT});

        // Now switch to "No pool override" and ensure resource_pool is omitted
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeResourcePool('No pool override');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Apply);
        await queryEditor.setQuery('SELECT 2;');
        await queryEditor.clickRunButton();

        await expect(async () => {
            expect(capturedBodies.length).toBeGreaterThan(0);

            const lastBody = capturedBodies[capturedBodies.length - 1] as {
                query?: string;
                resource_pool?: string;
            };

            expect(lastBody.query).toContain('SELECT 2;');
            expect(lastBody.resource_pool).toBeUndefined();
        }).toPass({timeout: VISIBILITY_TIMEOUT});
    });
});
