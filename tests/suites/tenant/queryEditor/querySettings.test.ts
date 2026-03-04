import {expect, test} from '@playwright/test';
import type {Page, Route} from '@playwright/test';

import {
    MAX_QUERY_TIMEOUT_SECONDS,
    QUERY_MODES,
    TRANSACTION_MODES,
} from '../../../../src/utils/query';
import {backend, database} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
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
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'query',
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
        await expect(queryEditor.settingsDialog.getTimeoutErrorMessage()).resolves.toBe(
            `Number must be less than or equal to ${MAX_QUERY_TIMEOUT_SECONDS}`,
        );

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

    test('Resource pool dropdown is populated from system view', async ({page}) => {
        await setupResourcePoolMock(page, ['default', 'olap']);

        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        const options = await queryEditor.settingsDialog.getResourcePoolOptions();

        expect(options).toContain('No pool override');
        expect(options).toContain('default');
        expect(options).toContain('olap');
    });

    test('Resource pool selection is persisted between dialog opens', async ({page}) => {
        await setupResourcePoolMock(page, ['default', 'olap']);

        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeResourcePool('olap');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
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
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
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
