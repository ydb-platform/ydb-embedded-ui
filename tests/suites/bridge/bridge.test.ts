import {expect, test} from '@playwright/test';

import {BridgeSyncStatus} from '../../../src/types/api/cluster';
import {PageModel} from '../../models/PageModel';
import {backend, nodesPage} from '../../utils/constants';
import {ClusterPage} from '../cluster/ClusterPage';
import {ClusterNodesTable, ClusterStorageTable} from '../paginatedTable/paginatedTable';
import {StoragePage} from '../storage/StoragePage';
import {VISIBILITY_TIMEOUT} from '../tenant/TenantPage';

import {bridgeVisualCluster} from './fixtures/bridgeVisualScenario';
import {
    mockBridgeHealthcheck,
    mockBridgeHealthcheckUnavailable,
    mockBridgeHealthcheckWithoutPileSupport,
    mockBridgeVisualLoadingScenario,
    mockBridgeVisualScenario,
    mockCapabilities,
    mockClusterWithBridgePiles,
    mockNodesWithPile,
    mockStorageGroup,
} from './mocks';

test.describe('Bridge mode - Nodes table', () => {
    test('off: no Bridge pile column and no group-by option', async ({page}) => {
        await mockCapabilities(page, false);
        await page.route(`${backend}/viewer/json/nodes?*`, (route) => route.continue());
        await page.goto(`/${nodesPage}`, {waitUntil: 'domcontentloaded'});
        const table = new ClusterNodesTable(page);
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).not.toContain('Bridge pile');
        // open columns setup and ensure Bridge pile not present
        await table.getControls().openColumnSetup();
        expect(await table.getControls().isColumnVisible('PileName')).toBeFalsy();
    });

    test('on: shows Bridge pile column', async ({page}) => {
        await mockCapabilities(page, true);
        await mockNodesWithPile(page);
        await page.goto(`/${nodesPage}`, {waitUntil: 'domcontentloaded'});
        const table = new ClusterNodesTable(page);
        await table.getControls().openColumnSetup();
        await table.getControls().setColumnChecked('PileName');
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).toContain('Bridge pile');
    });
});

test.describe('Bridge mode - Storage nodes', () => {
    test('on: shows Bridge pile and restores grouping from the URL', async ({page}) => {
        await mockCapabilities(page, true, {'/viewer/nodes': 20});
        await mockNodesWithPile(page);
        const storage = new StoragePage(page);
        await storage.goto({visible: 'all', type: 'nodes'}, {waitUntil: 'domcontentloaded'});
        const table = new ClusterStorageTable(page);
        await table.waitForTableToLoad();
        expect(await table.getHeaders()).toContain('Bridge pile');

        const groupBy = page.locator('.global-storage__controls-row .g-select');
        await groupBy.click();
        const groupedRequest = page.waitForRequest((request) => {
            const url = new URL(request.url());
            return (
                url.pathname.endsWith('/viewer/json/nodes') &&
                url.searchParams.get('group') === 'PileName'
            );
        });
        await page.getByRole('option', {name: 'Bridge pile', exact: true}).click();
        expect(new URL((await groupedRequest).url()).searchParams.get('type')).toBe('static');
        await expect(page).toHaveURL(/storageNodesGroupBy=PileName/);

        await page.reload();
        await expect(groupBy).toContainText('Bridge pile');
        const rowsRequest = page.waitForRequest((request) => {
            const url = new URL(request.url());
            return (
                url.pathname.endsWith('/viewer/json/nodes') &&
                url.searchParams.get('filter_group_by') === 'PileName'
            );
        });
        await page.getByRole('button', {name: /^r1/}).click();
        expect(new URL((await rowsRequest).url()).searchParams.get('filter_group')).toBe('r1');
    });

    test('off: ignores Bridge pile grouping from the URL and hides the option', async ({page}) => {
        await mockCapabilities(page, false, {'/viewer/nodes': 20});
        await mockNodesWithPile(page);
        const storage = new StoragePage(page);
        const nodesRequest = page.waitForRequest((request) => {
            const url = new URL(request.url());
            return (
                url.pathname.endsWith('/viewer/json/nodes') &&
                url.searchParams.get('type') === 'static'
            );
        });
        await storage.goto(
            {visible: 'all', type: 'nodes', storageNodesGroupBy: 'PileName'},
            {waitUntil: 'domcontentloaded'},
        );
        expect(new URL((await nodesRequest).url()).searchParams.has('group')).toBe(false);
        const table = new ClusterStorageTable(page);
        await table.waitForTableToLoad();
        expect(await table.getHeaders()).not.toContain('Bridge pile');
        await page.locator('.global-storage__controls-row .g-select').click();
        await expect(page.getByRole('option', {name: 'Bridge pile', exact: true})).toHaveCount(0);
    });
});

test.describe('Bridge mode - Storage groups', () => {
    test('on: shows Bridge pile column', async ({page}) => {
        await mockCapabilities(page, true);
        await mockStorageGroup(page, {
            GroupId: '1',
            PoolName: 'p',
            MediaType: 'NVME',
            PileName: 'r1',
        });
        const storage = new StoragePage(page);
        await storage.goto({visible: 'all', type: 'groups'}, {waitUntil: 'domcontentloaded'});
        const table = new ClusterStorageTable(page);
        await table.getControls().openColumnSetup();
        await table.getControls().setColumnChecked('PileName');
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).toContain('Bridge pile');
    });

    test('off: hides Bridge pile column', async ({page}) => {
        await mockCapabilities(page, false);
        const storage = new StoragePage(page);
        await storage.goto({visible: 'all', type: 'groups'}, {waitUntil: 'domcontentloaded'});
        const table = new ClusterStorageTable(page);
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).not.toContain('Bridge pile');
    });

    test('on: preserves unrecognised sync status group names', async ({page}) => {
        await page.route('**/viewer/capabilities', (route) =>
            route.fulfill({
                json: {
                    Settings: {Cluster: {BridgeModeEnabled: true}},
                    Capabilities: {'/storage/groups': 17},
                },
            }),
        );
        await page.route('**/storage/groups?*', (route) =>
            route.fulfill({
                json: {
                    FoundGroups: 7,
                    TotalGroups: 7,
                    StorageGroupGroups: [
                        {GroupName: 'WAITING_FOR_QUORUM', GroupCount: '3'},
                        {GroupName: 'RETRYING', GroupCount: '3'},
                        {GroupName: 'UNKNOWN', GroupCount: '1'},
                    ],
                },
            }),
        );

        await new StoragePage(page).goto({
            type: 'groups',
            storageGroupsGroupBy: 'BridgeSyncStatus',
        });
        await expect(page.getByRole('button', {name: /^WAITING_FOR_QUORUM/})).toBeVisible();
        await expect(page.getByRole('button', {name: /^RETRYING/})).toBeVisible();
        await expect(page.getByRole('button', {name: /^Unknown/})).toBeVisible();
    });
});

test.describe('Bridge mode - Storage group page', () => {
    const groupId = '2147483665';
    const poolName = 'storage-group-page-test-pool';

    test.beforeEach(async ({page}) => {
        await mockCapabilities(page, true, {'/storage/groups': 18});
    });

    test('shows sync details for a Bridge group', async ({page}) => {
        const stage = 'FUTURE_BRIDGE_STAGE';
        await mockStorageGroup(page, {
            GroupId: groupId,
            PoolName: poolName,
            BridgeMode: true,
            BridgeSyncStatus: BridgeSyncStatus.SYNCING,
            BridgeSyncStage: stage,
        });
        await new PageModel(page, 'storageGroup', {groupId}).goto();

        const toggle = page.getByRole('button', {name: /Synchronisation details/});
        await expect(toggle).toBeVisible();
        await toggle.click();
        await expect(page.getByTestId('storage-group-sync-stage')).toContainText(stage);
    });

    test('shows sync details for a v17 group without BridgeMode', async ({page}) => {
        await mockCapabilities(page, true, {'/storage/groups': 17});
        await mockStorageGroup(page, {
            GroupId: groupId,
            PoolName: poolName,
            BridgeSyncStatus: BridgeSyncStatus.SYNCING,
            BridgeSyncStage: 'BLOCKS',
        });
        await new PageModel(page, 'storageGroup', {groupId}).goto();

        await page.getByRole('button', {name: /Synchronisation details/}).click();
        await expect(page.getByTestId('storage-group-sync-stage')).toContainText('BLOCKS');
    });

    test('hides sync details for an ordinary group in a Bridge cluster', async ({page}) => {
        await mockStorageGroup(page, {
            GroupId: groupId,
            PoolName: poolName,
            BridgeMode: false,
            BridgeSyncStatus: BridgeSyncStatus.SYNCING,
        });
        await new PageModel(page, 'storageGroup', {groupId}).goto();

        await expect(
            page.locator('.ydb-storage-group-page__info').getByText(poolName, {exact: true}),
        ).toBeVisible();
        await expect(page.getByText('Synchronisation details', {exact: true})).toHaveCount(0);
    });
});

test.describe('Bridge mode - Cluster Overview', () => {
    test('on: uses cluster database counts and ignores legacy per-pile counts', async ({page}) => {
        await mockCapabilities(page, true);
        await mockBridgeVisualScenario(page);
        const bridgeInfo =
            'BridgeInfo' in bridgeVisualCluster ? bridgeVisualCluster.BridgeInfo : undefined;
        const piles = bridgeInfo?.Piles?.slice(0, 2);
        let cluster = {...bridgeVisualCluster, BridgeInfo: {...bridgeInfo, Piles: piles}};
        await page.route('**/viewer/json/cluster?*', (route) => route.fulfill({json: cluster}));
        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        await expect(page.getByTestId('bridge-databases-summary')).toHaveCount(1);
        await expect(page.getByTestId('bridge-databases-SYNCED')).toHaveText('5');
        await expect(page.getByTestId('bridge-databases-SYNCING')).toHaveText('1');
        const unknown = page.getByRole('img', {name: 'Sync status: Unknown: 1'});
        await unknown.focus();
        await expect(page.getByRole('tooltip')).toContainText('Sync status: Unknown');

        cluster = {
            ...cluster,
            BridgeInfo: {
                ...cluster.BridgeInfo,
                DatabaseCountsBySyncStatus: {SYNCED: '0', UNKNOWN: '1', NEW_BACKEND_STATUS: '7'},
            },
        };
        await page.reload();
        await expect(page.getByTestId('bridge-databases-SYNCED')).toHaveText('0');
        await expect(page.getByTestId('bridge-databases-UNKNOWN')).toHaveText('1');
        await expect(page.getByTestId('bridge-databases-SYNCING')).toHaveCount(0);
        await expect(page.getByTestId('bridge-databases-NEW_BACKEND_STATUS')).toHaveCount(0);
        await expect(page.getByTestId('bridge-databases-summary').getByRole('img')).toHaveCount(2);

        cluster = {
            ...cluster,
            Version: 10,
            BridgeInfo: {
                ...cluster.BridgeInfo,
                DatabaseCountsBySyncStatus: undefined,
                BridgeDatabasesComplete: false,
                Piles: piles?.map((pile) => ({
                    ...pile,
                    DatabaseCountsBySyncStatus: {SYNCED: '3', SYNCING: '2'},
                })),
            },
        };
        await page.reload();
        await expect(page.getByTestId('bridge-databases-SYNCED')).toHaveCount(0);
        await expect(page.getByTestId('bridge-databases-SYNCING')).toHaveCount(0);
        await expect(page.getByTestId('bridge-databases-summary')).toHaveText('Bridge databases:8');
        await expect(clusterPage.pileCards).toHaveCount(2);
        await expect(clusterPage.pileCards.getByRole('link')).toHaveCount(0);
        const url = page.url();
        const primaryPile = clusterPage.pileCards.filter({hasText: 'primary-pile'});
        for (const kind of ['storage', 'compute']) {
            const counter = primaryPile.getByTestId(`bridge-pile-${kind}-nodes`);
            await expect(counter).toHaveText('8 / 8 alive');
            await counter.click();
            await expect(page).toHaveURL(url);
        }
    });

    test('on: distinguishes missing alive counts from zero', async ({page}) => {
        await mockCapabilities(page, true);
        await mockBridgeHealthcheck(page);
        await page.route('**/viewer/json/cluster?*', (route) =>
            route.fulfill({
                json: {
                    Version: 10,
                    Domain: '/Root',
                    BridgeInfo: {
                        BridgeDatabases: '0',
                        DatabaseCountsBySyncStatus: {SYNCED: '0'},
                        Piles: [
                            {Name: 'unknown-alive', StorageNodes: 8, ComputeNodes: 8},
                            {
                                Name: 'zero-alive',
                                StorageNodes: 8,
                                AliveStorageNodes: 0,
                                ComputeNodes: 0,
                                AliveComputeNodes: 0,
                            },
                        ],
                    },
                },
            }),
        );
        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();
        const unknown = clusterPage.pileCards.filter({hasText: 'unknown-alive'});
        const zero = clusterPage.pileCards.filter({hasText: 'zero-alive'});
        await expect(unknown.getByTestId('bridge-pile-storage-nodes')).toHaveText('— / 8 alive');
        await expect(unknown.locator('.ydb-bridge-info-table__nodes-progress')).toHaveCount(0);
        await expect(unknown.locator('.g-progress')).toHaveCount(0);
        await expect(zero.getByTestId('bridge-pile-storage-nodes')).toHaveText('0 / 8 alive');
        await expect(zero.getByTestId('bridge-pile-compute-nodes')).toHaveText('0 / 0 alive');
        await expect(zero.locator('.g-progress')).toHaveCount(2);
        await expect(page.getByTestId('bridge-databases-summary')).toHaveText('Bridge databases:0');
        await expect(page.getByTestId('bridge-databases-SYNCED')).toHaveText('0');
    });

    test('off: does not show Bridge piles section', async ({page}) => {
        await mockCapabilities(page, false);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});

        // Bridge piles section should not be visible
        expect(await clusterPage.isBridgeSectionVisible()).toBe(false);
    });

    test('on: shows Bridge piles section with data', async ({page}) => {
        await mockCapabilities(page, true);
        await mockClusterWithBridgePiles(page);
        await mockBridgeHealthcheck(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});

        // Bridge piles section should be visible
        await expect(clusterPage.bridgeSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        // Should show pile cards
        const pileNames = clusterPage.pileCards.locator('.ydb-bridge-info-table__pile-name');
        const expectedOrder = ['all-group-statuses-pile', 'r1', 'r2'];
        await expect(pileNames).toHaveText(expectedOrder);

        const currentPile = clusterPage.pileCards.filter({hasText: 'r2'});
        const primaryPile = clusterPage.pileCards.filter({hasText: 'r1'});
        const failingPile = clusterPage.pileCards.filter({hasText: 'all-group-statuses-pile'});
        const currentHealthcheck = currentPile.getByTestId('bridge-pile-healthcheck');

        await expect(currentHealthcheck).toHaveAccessibleName(/Good/);
        await currentHealthcheck.hover();
        await expect(page.locator('.g-tooltip:visible')).toHaveText(
            'No issues reported for this pile',
        );
        await page.mouse.move(0, 0);

        await expect(currentPile).toContainText('Synchronised');
        await expect(currentPile.getByText('Nodes', {exact: true})).toBeVisible();
        await expect(currentPile.getByText('12', {exact: true})).toBeVisible();
        await expect(primaryPile).toContainText('Primary');
        await expect(primaryPile.getByText('16', {exact: true})).toBeVisible();
        await expect(currentPile).not.toContainText('Full');
        await expect(currentHealthcheck.locator('button')).toHaveCount(0);
        await expect(currentPile.getByRole('img', {name: 'You are here'})).toBeVisible();
        await expect(
            failingPile.getByTestId('bridge-pile-healthcheck').getByRole('button'),
        ).toHaveAccessibleName(/Caution/);

        await mockClusterWithBridgePiles(page, 'r2');
        await page.reload();
        await expect(currentPile).toContainText('Primary');
        await expect(pileNames).toHaveText(expectedOrder);
        await expect(currentPile.getByRole('img', {name: 'You are here'})).toBeVisible();
    });

    test('on: shows unavailable healthcheck as non-interactive unknown', async ({page}) => {
        await mockCapabilities(page, true);
        await mockClusterWithBridgePiles(page);
        await mockBridgeHealthcheckUnavailable(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
        await expect(clusterPage.bridgeSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const primaryPile = clusterPage.pileCards.filter({hasText: 'r1'});
        const healthcheck = primaryPile.getByTestId('bridge-pile-healthcheck');
        await expect(primaryPile).toContainText('Primary');
        await expect(healthcheck).toHaveAccessibleName(/Unknown/);
        await expect(healthcheck.locator('button')).toHaveCount(0);
        await expect(
            clusterPage.bridgeSection.getByRole('img', {name: 'You are here'}),
        ).toHaveCount(0);
    });

    test('on: uses scoped issues without assuming global pile support', async ({page}) => {
        await page.route('**/viewer/json/whoami*', async (route) => {
            await route.fulfill({
                json: {
                    UserSID: 'bridge-test-user',
                    UserID: 'bridge-test-user',
                    AuthType: 'Login',
                    IsViewerAllowed: true,
                    IsMonitoringAllowed: true,
                },
            });
        });
        await mockCapabilities(page, true);
        await mockClusterWithBridgePiles(page);
        await mockBridgeHealthcheckWithoutPileSupport(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
        await expect(clusterPage.bridgeSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        for (const pileName of ['r1', 'r2']) {
            const healthcheck = clusterPage.pileCards
                .filter({hasText: pileName})
                .getByTestId('bridge-pile-healthcheck');
            await expect(healthcheck).toHaveAccessibleName(/Unknown/);
            await expect(healthcheck.locator('button')).toHaveCount(0);
        }

        const scopedHealthcheck = clusterPage.pileCards
            .filter({hasText: 'all-group-statuses-pile'})
            .getByTestId('bridge-pile-healthcheck');
        await expect(scopedHealthcheck.getByRole('button')).toHaveAccessibleName(/Caution/);
        await expect(scopedHealthcheck.locator('button')).toHaveCount(1);
        await expect(
            clusterPage.bridgeSection.getByRole('img', {name: 'You are here'}),
        ).toHaveCount(0);

        await page.unroute('**/viewer/json/healthcheck?*');
        await mockBridgeHealthcheck(page, null);
        await page.reload({waitUntil: 'domcontentloaded'});
        await expect(clusterPage.bridgeSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        for (const pileName of ['r1', 'r2']) {
            const healthcheck = clusterPage.pileCards
                .filter({hasText: pileName})
                .getByTestId('bridge-pile-healthcheck');
            await expect(healthcheck).toHaveAccessibleName(/Good/);
        }
        await expect(scopedHealthcheck.getByRole('button')).toHaveAccessibleName(/Caution/);
        await expect(
            clusterPage.bridgeSection.getByRole('img', {name: 'You are here'}),
        ).toHaveCount(0);
    });

    test('on: opens the source healthcheck issue from a pile badge', async ({page}) => {
        await mockCapabilities(page, true);
        await mockClusterWithBridgePiles(page);
        await mockBridgeHealthcheck(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
        await expect(clusterPage.bridgeSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const failingPile = clusterPage.pileCards.filter({
            hasText: 'all-group-statuses-pile',
        });
        const healthcheckButton = failingPile
            .getByTestId('bridge-pile-healthcheck')
            .locator('button');
        await expect(healthcheckButton).toHaveAccessibleName(
            'Health status for pile all-group-statuses-pile: Caution',
        );
        await healthcheckButton.hover();
        await expect(page.locator('.g-tooltip:visible')).toHaveText('Caution');
        await healthcheckButton.press('Enter');

        const drawer = page.getByTestId('cluster-healthcheck-details');
        await expect(drawer).toBeVisible();
        await expect(page).toHaveURL(/showHealthcheck=1/);
        await expect(page).toHaveURL(/healthcheckIssue=failing-pile-root/);
        await expect(page).toHaveURL(/healthcheckLeaf=failing-pile-leaf/);

        const issueCard = drawer.getByTestId('healthcheck-issue-failing-pile-leaf');
        await expect(issueCard).toBeVisible();
        await expect(issueCard).toBeInViewport();
        await expect(issueCard.locator('[aria-expanded="true"]')).toHaveCount(1);
        await expect(issueCard.locator('.ydb-healthcheck__issue-tab_active')).toContainText(
            'Storage',
        );
        await expect(issueCard.getByText('Pile', {exact: true})).toBeVisible();
        await expect(issueCard.getByText('all-group-statuses-pile', {exact: true})).toBeVisible();

        await issueCard.locator('.ydb-healthcheck__issue-tab').filter({hasText: 'VDisk'}).click();
        await expect(issueCard).not.toContainText('all-group-statuses-pile');
    });

    test('on: scrolls to a deep-linked issue after delayed healthcheck loading', async ({page}) => {
        await page.setViewportSize({width: 1440, height: 500});
        await mockCapabilities(page, true);
        const releaseHealthcheck = await mockBridgeVisualLoadingScenario(page);

        try {
            const clusterPage = new ClusterPage(page);
            await clusterPage.goto(
                {
                    showHealthcheck: 1,
                    view: 'storage',
                    healthcheckIssue: 'BLUE-promoted-pile-pool',
                    healthcheckLeaf: 'BLUE-promoted-pile-group',
                },
                {waitUntil: 'domcontentloaded'},
            );

            const drawer = page.getByTestId('cluster-healthcheck-details');
            const issueCard = drawer.getByTestId('healthcheck-issue-BLUE-promoted-pile-group');
            const scrollContainer = drawer.locator('.ydb-fullscreen__content');

            await expect(drawer).toBeVisible();
            await expect(issueCard).toHaveCount(0);

            // Keep the request pending until Gravity Drawer has completed its 300 ms transition.
            await page.waitForTimeout(350);
            releaseHealthcheck();

            await expect(issueCard).toBeVisible();
            await expect
                .poll(() => scrollContainer.evaluate((element) => element.scrollTop))
                .toBeGreaterThan(0);
            await expect(issueCard).toBeInViewport();
        } finally {
            releaseHealthcheck();
        }
    });

    test('on: updates the selected tab when the target changes in an open drawer', async ({
        page,
    }) => {
        await mockCapabilities(page, true);
        await mockBridgeVisualScenario(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
        await expect(clusterPage.bridgeSection).toBeVisible();

        const promotedPile = clusterPage.pileCards.filter({hasText: 'promoted-pile'});
        await promotedPile.getByTestId('bridge-pile-healthcheck').locator('button').click();

        const drawer = page.getByTestId('cluster-healthcheck-details');
        const issueCard = drawer.getByTestId('healthcheck-issue-BLUE-promoted-pile-group');
        const activeTab = issueCard.locator('.ydb-healthcheck__issue-tab_active');

        await expect(activeTab).toContainText('Storage pool');

        await page.evaluate(() => {
            const url = new URL(window.location.href);
            url.searchParams.set('healthcheckIssue', 'BLUE-promoted-pile-group');
            window.history.pushState({}, '', url);
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        await expect(activeTab).toContainText('Storage group');
    });

    test('on: shows combined bridge pile and healthcheck states', async ({page}) => {
        await page.setViewportSize({width: 1440, height: 900});
        await mockCapabilities(page, true);
        await mockBridgeVisualScenario(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
        await expect(clusterPage.bridgeSection).toBeVisible();
        await expect(clusterPage.pileCards.locator('.ydb-bridge-info-table__pile-name')).toHaveText(
            [
                'disconnected-pile',
                'not-synchronized-pile',
                'primary-pile',
                'promoted-pile',
                'suspended-pile',
                'synchronized-pile',
            ],
        );

        await expect(clusterPage.bridgeSection).toHaveScreenshot('bridge-piles-states.png');
    });

    test('on: shows bridge pile healthcheck loading state', async ({page}) => {
        await page.setViewportSize({width: 1440, height: 900});
        await mockCapabilities(page, true);
        const releaseHealthcheck = await mockBridgeVisualLoadingScenario(page);
        const clusterPage = new ClusterPage(page);

        try {
            await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
            await expect(clusterPage.bridgeSection).toBeVisible();
            await expect(
                clusterPage.bridgeSection.locator('.ydb-bridge-info-table__healthcheck-skeleton'),
            ).toHaveCount(6);
            await expect(
                clusterPage.bridgeSection.getByRole('img', {name: 'You are here'}),
            ).toHaveCount(0);
            await expect(
                clusterPage.pileCards.first().locator('.ydb-bridge-info-table__pile-name'),
            ).toHaveText('disconnected-pile');
            await expect(clusterPage.bridgeSection).toHaveScreenshot(
                'bridge-piles-healthcheck-loading.png',
            );
        } finally {
            releaseHealthcheck();
        }
        await expect(
            clusterPage.pileCards.first().locator('.ydb-bridge-info-table__pile-name'),
        ).toHaveText('disconnected-pile');
        await expect(
            clusterPage.pileCards
                .filter({hasText: 'synchronized-pile'})
                .getByRole('img', {name: 'You are here'}),
        ).toBeVisible();
    });
});
