import {expect, test} from '@playwright/test';

import {backend, nodesPage} from '../../utils/constants';
import {ClusterPage} from '../cluster/ClusterPage';
import {ClusterNodesTable, ClusterStorageTable} from '../paginatedTable/paginatedTable';
import {StoragePage} from '../storage/StoragePage';

import {
    mockCapabilities,
    mockClusterWithBridgePiles,
    mockNodesWithPile,
    mockStorageGroupsWithPile,
} from './mocks';

test.describe('Bridge mode - Nodes table', () => {
    test('off: no Pile Name column and no group-by option', async ({page}) => {
        await mockCapabilities(page, false);
        await page.route(`${backend}/viewer/json/nodes?*`, (route) => route.continue());
        await page.goto(`/${nodesPage}`);
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
        await page.goto(`/${nodesPage}`);
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
        await storage.goto({visible: 'all'});
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
        await storage.goto({visible: 'all'});
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
        await storage.goto({visible: 'all', type: 'groups'});
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
        await storage.goto({visible: 'all', type: 'groups'});
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
        await clusterPage.goto();

        // Bridge piles section should not be visible
        expect(await clusterPage.isBridgeSectionVisible()).toBe(false);
    });

    test('on: shows Bridge piles section with data', async ({page}) => {
        await mockCapabilities(page, true);
        await mockClusterWithBridgePiles(page);

        const clusterPage = new ClusterPage(page);
        await clusterPage.goto();

        // Bridge piles section should be visible
        expect(await clusterPage.isBridgeSectionVisible()).toBe(true);

        // Should show pile cards
        expect(await clusterPage.getPileCardsCount()).toBe(2);

        // Check first pile content
        const firstPileContent = await clusterPage.getFirstPileContent();
        expect(firstPileContent).toContain('r1');
        expect(firstPileContent).toContain('PRIMARY'); // State
        expect(firstPileContent).toContain('16'); // Nodes count
    });
});
