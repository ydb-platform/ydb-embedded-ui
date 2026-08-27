import {expect, test} from '@playwright/test';

import {backend, nodesPage} from '../../utils/constants';
import {ClusterPage} from '../cluster/ClusterPage';
import {ClusterNodesTable, ClusterStorageTable} from '../paginatedTable/paginatedTable';
import {StoragePage} from '../storage/StoragePage';
import {VISIBILITY_TIMEOUT} from '../tenant/TenantPage';

import {
    mockBridgeHealthcheck,
    mockBridgeHealthcheckUnavailable,
    mockBridgeVisualLoadingScenario,
    mockBridgeVisualScenario,
    mockCapabilities,
    mockClusterWithBridgePiles,
    mockNodesWithPile,
    mockStorageGroupsWithPile,
} from './mocks';

test.describe('Bridge mode - Nodes table', () => {
    test('off: no Pile Name column and no group-by option', async ({page}) => {
        await mockCapabilities(page, false);
        await page.route(`${backend}/viewer/json/nodes?*`, (route) => route.continue());
        await page.goto(`/${nodesPage}`, {waitUntil: 'domcontentloaded'});
        const table = new ClusterNodesTable(page);
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).not.toContain('Pile Name');
        // open columns setup and ensure Pile Name not present
        await table.getControls().openColumnSetup();
        expect(await table.getControls().isColumnVisible('PileName')).toBeFalsy();
    });

    test('on: shows Pile Name column', async ({page}) => {
        await mockCapabilities(page, true);
        await mockNodesWithPile(page);
        await page.goto(`/${nodesPage}`, {waitUntil: 'domcontentloaded'});
        const table = new ClusterNodesTable(page);
        await table.getControls().openColumnSetup();
        await table.getControls().setColumnChecked('PileName');
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).toContain('Pile Name');
    });
});

test.describe('Bridge mode - Storage nodes', () => {
    test('on: shows Pile Name', async ({page}) => {
        await mockCapabilities(page, true);
        await mockNodesWithPile(page);
        const storage = new StoragePage(page);
        await storage.goto({visible: 'all'}, {waitUntil: 'domcontentloaded'});
        const table = new ClusterStorageTable(page);
        await table.getControls().openColumnSetup();
        await table.getControls().setColumnChecked('PileName');
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).toContain('Pile Name');
    });

    test('off: hides Pile Name', async ({page}) => {
        await mockCapabilities(page, false);
        const storage = new StoragePage(page);
        await storage.goto({visible: 'all'}, {waitUntil: 'domcontentloaded'});
        const table = new ClusterStorageTable(page);
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).not.toContain('Pile Name');
    });
});

test.describe('Bridge mode - Storage groups', () => {
    test('on: shows Pile Name and group-by option', async ({page}) => {
        await mockCapabilities(page, true);
        await mockStorageGroupsWithPile(page);
        const storage = new StoragePage(page);
        await storage.goto({visible: 'all', type: 'groups'}, {waitUntil: 'domcontentloaded'});
        const table = new ClusterStorageTable(page);
        await table.getControls().openColumnSetup();
        await table.getControls().setColumnChecked('PileName');
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).toContain('Pile Name');
    });

    test('off: hides Pile Name and group-by option', async ({page}) => {
        await mockCapabilities(page, false);
        const storage = new StoragePage(page);
        await storage.goto({visible: 'all', type: 'groups'}, {waitUntil: 'domcontentloaded'});
        const table = new ClusterStorageTable(page);
        await table.waitForTableToLoad();
        const headers = await table.getHeaders();
        expect(headers.join(' ')).not.toContain('Pile Name');
    });
});

test.describe('Bridge mode - Cluster Overview', () => {
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
        expect(await clusterPage.getPileCardsCount()).toBe(3);

        await expect(
            clusterPage.pileCards.first().getByTestId('bridge-pile-healthcheck'),
        ).toContainText('Good');

        // Check first pile content
        const firstPileContent = await clusterPage.getFirstPileContent();
        expect(firstPileContent).toContain('r1');
        expect(firstPileContent).toContain('Primary'); // State
        expect(firstPileContent).toContain('Nodes: 16');
        expect(firstPileContent).not.toContain('Full');
        await expect(
            clusterPage.pileCards.first().getByTestId('bridge-pile-healthcheck').locator('button'),
        ).toHaveCount(0);

        await expect(clusterPage.pileCards.nth(1)).toContainText('You are here');
        await expect(clusterPage.pileCards.nth(2)).toContainText('Caution');
    });

    test('on: shows unavailable healthcheck as non-interactive unknown', async ({page}) => {
        await mockCapabilities(page, true);
        await mockClusterWithBridgePiles(page);
        await mockBridgeHealthcheckUnavailable(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
        await expect(clusterPage.bridgeSection).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const healthcheck = clusterPage.pileCards.first().getByTestId('bridge-pile-healthcheck');
        await expect(healthcheck).toContainText('Unknown');
        await expect(healthcheck.locator('button')).toHaveCount(0);
        await expect(clusterPage.bridgeSection).not.toContainText('You are here');
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
        await healthcheckButton.click();

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

    test('on: shows combined bridge pile and healthcheck states', async ({page}) => {
        await page.setViewportSize({width: 1440, height: 900});
        await mockCapabilities(page, true);
        await mockBridgeVisualScenario(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
        await expect(clusterPage.bridgeSection).toBeVisible();

        await expect(clusterPage.bridgeSection).toHaveScreenshot('bridge-piles-states.png');
    });

    test('on: shows bridge pile healthcheck loading state', async ({page}) => {
        await page.setViewportSize({width: 1440, height: 900});
        await mockCapabilities(page, true);
        const releaseHealthcheck = await mockBridgeVisualLoadingScenario(page);

        try {
            const clusterPage = new ClusterPage(page);
            await clusterPage.goto(undefined, {waitUntil: 'domcontentloaded'});
            await expect(clusterPage.bridgeSection).toBeVisible();
            await expect(
                clusterPage.bridgeSection.locator('.ydb-bridge-info-table__healthcheck-skeleton'),
            ).toHaveCount(6);
            await expect(clusterPage.bridgeSection).not.toContainText('You are here');
            await expect(clusterPage.bridgeSection).toHaveScreenshot(
                'bridge-piles-healthcheck-loading.png',
            );
        } finally {
            releaseHealthcheck();
        }
    });
});
