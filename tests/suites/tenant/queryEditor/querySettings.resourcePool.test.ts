import {expect, test} from '@playwright/test';
import type {Route} from '@playwright/test';

import {backend} from '../../../utils/constants';
import {VISIBILITY_TIMEOUT} from '../TenantPage';

import {ButtonNames, QueryEditor} from './models/QueryEditor';
import {
    fulfillResourcePools,
    setupQuerySettingsPage,
    setupResourcePoolMock,
} from './querySettings.helpers';

test.describe('Query Settings resource pool', () => {
    test.beforeEach(async ({page}) => {
        await setupQuerySettingsPage(page);
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
