import {expect, test} from '@playwright/test';

import {backend, nodesPage} from '../../utils/constants';
import {ClusterNodesTable, ClusterStorageTable} from '../paginatedTable/paginatedTable';
import {StoragePage} from '../storage/StoragePage';

import {mockCapabilities, mockNodesWithPile, mockStorageGroupsWithPile} from './mocks';

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
        await table.getControls().applyColumnVisibility();
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
        await table.getControls().applyColumnVisibility();
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
        await table.getControls().applyColumnVisibility();
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
