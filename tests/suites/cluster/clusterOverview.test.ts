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

async function mockClusterOverviewWithMixedUnits(page: Page) {
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
                NetworkUtilization: 0.42,
                NetworkWriteThroughput: '512000000',
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
});
