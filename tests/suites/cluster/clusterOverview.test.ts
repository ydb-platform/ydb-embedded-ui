import type {Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {ClusterPage} from './ClusterPage';

const CLUSTER_OVERVIEW_SCREENSHOT_VIEWPORT = {width: 1600, height: 1000};
const VISIBILITY_TIMEOUT = 15000;

async function setupMonitoringUserMock(page: Page) {
    await page.route('**/viewer/json/whoami**', async (route) => {
        await route.fulfill({
            json: {
                UserSID: 'test-user',
                UserID: 'test-user-id',
                AuthType: 'Login',
                IsViewerAllowed: true,
                IsMonitoringAllowed: true,
                IsAdministrationAllowed: true,
            },
        });
    });
}

async function setupClusterDashboardCapabilitiesMock(page: Page) {
    await page.route('**/capabilities**', async (route) => {
        const url = new URL(route.request().url());
        const isClusterCapabilitiesRequest = url.pathname.endsWith('/viewer/capabilities');

        await route.fulfill({
            json: isClusterCapabilitiesRequest
                ? {
                      Database: '/local',
                      Settings: {Cluster: {BridgeModeEnabled: false}},
                      Capabilities: {
                          '/viewer/cluster': 5,
                      },
                  }
                : {
                      Capabilities: {},
                  },
        });
    });
}

async function setupNodesListMock(page: Page) {
    await page.route('**/viewer/json/nodelist**', async (route) => {
        await route.fulfill({json: []});
    });
}

async function mockClusterOverviewWithMixedUnits(page: Page, networkUtilization = 0.42) {
    await page.route('**/viewer/json/cluster**', async (route) => {
        await route.fulfill({
            json: {
                Version: 6,
                Domain: '/local',
                Overall: 'Green',
                CoresUsed: '2',
                CoresTotal: 16,
                MapStorageUsed: {
                    HDD: '1000000000',
                    SSD: '1000000',
                },
                MapStorageTotal: {
                    HDD: '2000000000000',
                    SSD: '36000000000000',
                },
                MemoryUsed: '1000000',
                MemoryTotal: '36000000000000',
                NetworkUtilization: networkUtilization,
                NetworkWriteThroughput: '512000000',
            },
        });
    });
}

async function mockClusterOverviewWithStorageGroups(page: Page) {
    await page.route('**/viewer/json/cluster**', async (route) => {
        await route.fulfill({
            json: {
                Version: 6,
                Domain: '/local',
                Overall: 'Green',
                StorageStats: [
                    {
                        PDiskFilter: 'Type:ROT',
                        ErasureSpecies: 'block-4-2',
                        CurrentGroupsCreated: 65,
                        AvailableGroupsToCreate: 199,
                    },
                    {
                        PDiskFilter: 'Type:ROT',
                        ErasureSpecies: 'none',
                        CurrentGroupsCreated: 12,
                        AvailableGroupsToCreate: 0,
                    },
                    {
                        PDiskFilter: 'Type:ROT',
                        ErasureSpecies: 'mirror-3of4',
                        CurrentGroupsCreated: 60,
                        AvailableGroupsToCreate: 202,
                    },
                    {
                        PDiskFilter: 'Type:SSD',
                        ErasureSpecies: 'block-4-2',
                        CurrentGroupsCreated: 542,
                        AvailableGroupsToCreate: 225,
                    },
                    {
                        PDiskFilter: 'Type:SSD',
                        ErasureSpecies: 'mirror-3-dc',
                        CurrentGroupsCreated: 50,
                        AvailableGroupsToCreate: 227,
                    },
                    {
                        PDiskFilter: 'Type:SSD',
                        ErasureSpecies: 'none',
                        CurrentGroupsCreated: 8,
                        AvailableGroupsToCreate: undefined,
                    },
                ],
            },
        });
    });
}

test.describe('Cluster Overview', () => {
    test('dashboard renders adaptive units with all metric cards', async ({page}) => {
        await page.setViewportSize(CLUSTER_OVERVIEW_SCREENSHOT_VIEWPORT);
        await setupMonitoringUserMock(page);
        await setupClusterDashboardCapabilitiesMock(page);
        await setupNodesListMock(page);
        await mockClusterOverviewWithMixedUnits(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto({}, {waitUntil: 'domcontentloaded'});

        const overview = page.locator('.ydb-cluster-dashboard__overview-wrapper');
        const dashboard = overview.locator('.ydb-cluster-dashboard__dashboard-wrapper');

        await expect(overview).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await expect(dashboard.locator('.ydb-cluster-dashboard__card')).toHaveCount(5);
        await expect(dashboard.getByText('1 GB of 2 TB')).toBeVisible();
        await expect(dashboard.getByText('1 MB of 36 TB')).toHaveCount(2);
        await expect(overview).toHaveScreenshot('cluster-overview-mixed-units.png');
    });

    test('collapsed metric card uses the displayed rounded percentage', async ({page}) => {
        await setupMonitoringUserMock(page);
        await setupClusterDashboardCapabilitiesMock(page);
        await setupNodesListMock(page);
        await mockClusterOverviewWithMixedUnits(page, 0.575);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto({}, {waitUntil: 'domcontentloaded'});

        const overview = page.locator('.ydb-cluster-dashboard__overview-wrapper');
        await expect(overview.getByText('58%', {exact: true})).toBeVisible({
            timeout: VISIBILITY_TIMEOUT,
        });
        await overview.getByRole('button', {name: 'Overview'}).click();

        await expect(overview.getByText('Network : 58%', {exact: true})).toBeVisible({
            timeout: VISIBILITY_TIMEOUT,
        });
    });

    test('allocated storage groups hide unallocated media and erasure policies', async ({page}) => {
        await setupMonitoringUserMock(page);
        await setupClusterDashboardCapabilitiesMock(page);
        await setupNodesListMock(page);
        await page.route('**/viewer/json/cluster**', async (route) => {
            await route.fulfill({
                json: {
                    Version: 8,
                    Domain: '/local',
                    Overall: 'Green',
                    StorageStats: [
                        {
                            PDiskFilter: 'Type:ROT',
                            ErasureSpecies: 'block-4-2',
                            CurrentGroupsCreated: 0,
                            AvailableGroupsToCreate: 80,
                        },
                        {
                            PDiskFilter: 'Type:ROT',
                            ErasureSpecies: 'mirror-3-dc',
                            AvailableGroupsToCreate: 84,
                        },
                        {
                            PDiskFilter: 'Type:SSD',
                            ErasureSpecies: 'block-4-2',
                            CurrentGroupsCreated: 11,
                            AvailableGroupsToCreate: 52,
                        },
                        {
                            PDiskFilter: 'Type:SSD',
                            ErasureSpecies: 'mirror-3-dc',
                            CurrentGroupsCreated: 0,
                            AvailableGroupsToCreate: 1103,
                        },
                    ],
                },
            });
        });

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto({}, {waitUntil: 'domcontentloaded'});

        const storageSection = clusterPage.clusterInfo.locator('.cluster-info__storage-section');
        await expect(storageSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await expect(
            storageSection.getByText('Allocated Storage Groups 11', {exact: true}),
        ).toBeVisible();
        await expect(
            storageSection.getByRole('group', {name: /storage group allocation/}),
        ).toHaveCount(1);
        await expect(
            storageSection.getByRole('group', {name: 'SSD storage group allocation: 17%'}),
        ).toBeVisible();
        await expect(storageSection.getByText('52 groups', {exact: true})).toBeVisible();
        await expect(storageSection.getByText('block-4-2', {exact: true})).toBeVisible();
        await expect(storageSection.getByText('HDD', {exact: true})).toHaveCount(0);
        await expect(storageSection.getByText('mirror-3-dc', {exact: true})).toHaveCount(0);
    });

    test('allocated storage groups fit a narrow viewport', async ({page}) => {
        const viewport = {width: 390, height: 1000};
        await page.setViewportSize(viewport);
        await setupMonitoringUserMock(page);
        await setupClusterDashboardCapabilitiesMock(page);
        await setupNodesListMock(page);
        await mockClusterOverviewWithStorageGroups(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto({}, {waitUntil: 'domcontentloaded'});

        const storageSection = clusterPage.clusterInfo.locator('.cluster-info__storage-section');
        await expect(
            storageSection.getByText('Allocated Storage Groups 737', {exact: true}),
        ).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        const cards = storageSection.locator('.ydb-disk-groups-stats__card');
        await expect(cards).toHaveCount(2);

        const cardBounds = await cards.evaluateAll((elements) =>
            elements.map((element) => {
                const bounds = element.getBoundingClientRect();

                return {
                    left: bounds.left,
                    right: bounds.right,
                    clientWidth: element.clientWidth,
                    scrollWidth: element.scrollWidth,
                };
            }),
        );
        for (const bounds of cardBounds) {
            expect(bounds.left).toBeGreaterThanOrEqual(0);
            expect(bounds.right).toBeLessThanOrEqual(viewport.width);
            expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth);
        }
    });

    for (const theme of ['light', 'dark']) {
        test(`allocated storage groups respect minimum segment width in ${theme}`, async ({
            page,
        }) => {
            await page.setViewportSize(CLUSTER_OVERVIEW_SCREENSHOT_VIEWPORT);
            await page.addInitScript((themeName) => {
                localStorage.setItem('theme', themeName);
            }, theme);
            await setupMonitoringUserMock(page);
            await setupClusterDashboardCapabilitiesMock(page);
            await setupNodesListMock(page);
            await page.route('**/viewer/json/cluster**', async (route) => {
                await route.fulfill({
                    json: {
                        Version: 8,
                        Domain: '/local',
                        Overall: 'Green',
                        StorageStats: [
                            {
                                PDiskFilter: 'Type:ROT',
                                ErasureSpecies: 'block-4-2',
                                CurrentGroupsCreated: 0,
                                AvailableGroupsToCreate: 20,
                            },
                            {
                                PDiskFilter: 'Type:SSD',
                                ErasureSpecies: 'block-4-2',
                                CurrentGroupsCreated: 0,
                                AvailableGroupsToCreate: 600,
                            },
                            {
                                PDiskFilter: 'Type:SSD',
                                ErasureSpecies: 'mirror-3-dc',
                                CurrentGroupsCreated: 1,
                                AvailableGroupsToCreate: 600,
                            },
                            {
                                PDiskFilter: 'Type:SSD',
                                ErasureSpecies: 'none',
                                CurrentGroupsCreated: 0,
                                AvailableGroupsToCreate: 0,
                            },
                        ],
                    },
                });
            });

            const clusterPage = new ClusterPage(page);
            await clusterPage.goto({}, {waitUntil: 'domcontentloaded'});

            const storageSection = clusterPage.clusterInfo.locator(
                '.cluster-info__storage-section',
            );
            await expect(storageSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});
            await expect(
                storageSection.getByText('Allocated Storage Groups 1', {exact: true}),
            ).toBeVisible();
            const hddProgress = storageSection.getByRole('group', {
                name: 'HDD storage group allocation: 0%',
            });
            const ssdProgress = storageSection.getByRole('group', {
                name: 'SSD storage group allocation: 0%',
            });
            await expect(hddProgress).toHaveCount(0);
            await expect(ssdProgress.getByRole('progressbar')).toHaveAttribute(
                'aria-valuenow',
                '0.2',
            );
            await expect(storageSection.getByText('none', {exact: true})).toHaveCount(0);
            await expect(storageSection.getByText('block-4-2', {exact: true})).toHaveCount(0);
            await expect(storageSection.getByText('HDD', {exact: true})).toHaveCount(0);
            await expect(storageSection.getByText('600 groups', {exact: true})).toBeVisible();

            const ssdSegments = ssdProgress.locator('.ydb-disk-groups-stats__progress-segment');
            await expect(ssdSegments).toHaveCount(1);
            expect(
                await ssdSegments.evaluateAll((segments) =>
                    segments.map((segment) => segment.getBoundingClientRect().width),
                ),
            ).toEqual([10]);

            await ssdProgress
                .locator('.ydb-disk-groups-stats__progress-segment-trigger')
                .first()
                .hover();
            await expect(
                page.getByText('600 groups available if only mirror-3-dc is used', {exact: true}),
            ).toBeVisible();
            await page.mouse.move(0, 0);

            await expect(storageSection).toHaveScreenshot(
                `allocated-storage-groups-min-segments-${theme}.png`,
            );
        });

        test(`allocated storage groups match the ${theme} design`, async ({page}) => {
            await page.setViewportSize(CLUSTER_OVERVIEW_SCREENSHOT_VIEWPORT);
            await page.addInitScript((themeName) => {
                localStorage.setItem('theme', themeName);
            }, theme);
            await setupMonitoringUserMock(page);
            await setupClusterDashboardCapabilitiesMock(page);
            await setupNodesListMock(page);
            await mockClusterOverviewWithStorageGroups(page);

            const clusterPage = new ClusterPage(page);
            await clusterPage.goto({}, {waitUntil: 'domcontentloaded'});

            const storageSection = clusterPage.clusterInfo.locator(
                '.cluster-info__storage-section',
            );
            await expect(storageSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});
            await expect(
                storageSection.getByText('Allocated Storage Groups 737', {exact: true}),
            ).toBeVisible();
            await expect(storageSection.getByText('0–202 groups', {exact: true})).toBeVisible();
            await expect(storageSection.getByText('0–227 groups', {exact: true})).toBeVisible();
            await expect(storageSection.getByText('none', {exact: true})).toHaveCount(2);
            await expect(storageSection.getByText('12 groups', {exact: true})).toBeVisible();
            await expect(storageSection.getByText('8 groups', {exact: true})).toBeVisible();
            await expect(
                storageSection.getByRole('group', {name: /storage group allocation/}),
            ).toHaveCount(2);
            await expect(
                storageSection.getByRole('group', {
                    name: 'HDD storage group allocation: 58%',
                }),
            ).toBeVisible();
            await expect(
                storageSection.getByRole('group', {
                    name: 'SSD storage group allocation: 84%',
                }),
            ).toBeVisible();

            const hddProgress = storageSection.getByRole('group', {
                name: 'HDD storage group allocation: 58%',
            });
            const segmentGaps = await hddProgress
                .locator('.ydb-disk-groups-stats__progress-segment')
                .evaluateAll((segments) =>
                    segments.slice(1).map((segment, index) => {
                        const previousBounds = segments[index].getBoundingClientRect();
                        const currentBounds = segment.getBoundingClientRect();

                        return currentBounds.left - previousBounds.right;
                    }),
                );
            expect(segmentGaps).toEqual([4, 4]);

            const availableGroupsContext =
                'Estimated number of free groups available for allocation.';
            const availableHelpMark = storageSection.getByRole('button', {
                name: 'About available HDD storage groups',
                exact: true,
            });
            await expect(availableHelpMark).toHaveCount(1);
            await expect(
                storageSection.getByRole('button', {
                    name: 'About available SSD storage groups',
                    exact: true,
                }),
            ).toHaveCount(1);
            const availableColors = await availableHelpMark.evaluate((helpMark) => {
                const label = helpMark.closest('.g-label');

                return {
                    helpMark: getComputedStyle(helpMark).color,
                    label: label ? getComputedStyle(label).color : undefined,
                };
            });
            expect(availableColors.helpMark).toBe(availableColors.label);

            await availableHelpMark.hover();
            const availableGroupsPopover = page.getByText(availableGroupsContext, {exact: true});
            await expect(availableGroupsPopover).toBeVisible();

            const helpMarkBounds = await availableHelpMark.boundingBox();
            const popoverBounds = await availableGroupsPopover.boundingBox();
            if (!helpMarkBounds || !popoverBounds) {
                throw new Error('HelpMark and its popover must have visible bounds');
            }
            expect(popoverBounds.y + popoverBounds.height).toBeLessThanOrEqual(helpMarkBounds.y);

            const firstSegment = storageSection
                .locator('.ydb-disk-groups-stats__progress-segment-trigger')
                .first();
            await firstSegment.hover();
            await expect(
                page.getByText('199 groups available if only block-4-2 is used', {exact: true}),
            ).toBeVisible();
            await page.mouse.move(0, 0);

            const noneSegment = storageSection
                .locator('.ydb-disk-groups-stats__progress-segment-trigger')
                .nth(2);
            await noneSegment.hover();
            await expect(
                page.getByText('0 groups available if only none is used', {exact: true}),
            ).toBeVisible();
            await page.mouse.move(0, 0);

            await expect(storageSection).toHaveScreenshot(`allocated-storage-groups-${theme}.png`);
        });
    }
});
