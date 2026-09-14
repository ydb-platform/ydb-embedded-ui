import {expect, test} from '@playwright/test';

import {ClusterNodesTable} from '../paginatedTable/paginatedTable';

import {NodesPage} from './NodesPage';
import {setupPopupScrollMocks} from './popupScrollMocks';

for (const {disk, height} of [
    {disk: 'PDisk', height: 800},
    {disk: 'VDisk', height: 800},
    {disk: 'VDisk', height: 320},
]) {
    test(`wheel over an ordinary ${disk} popup scrolls its table at ${height}px`, async ({
        page,
    }) => {
        const nodes = await setupPopupScrollMocks(page, 40);
        if (height === 320) {
            Object.assign(nodes[0].VDisks[0], {
                StoragePoolName: 'popup-test-pool',
                Replicated: false,
                ReplicationProgress: 0.5,
                ReplicationSecondsRemaining: 120,
                UnsyncedVDisks: 3,
                ReadThroughput: '1000000',
                WriteThroughput: '1000000',
            });
        }
        await page.setViewportSize({width: 1280, height});
        await new NodesPage(page).goto({clusterName: 'popup-test', backend: 'https://popup.test'});
        const table = new ClusterNodesTable(page);
        const controls = table.getControls();
        await controls.openColumnSetup();
        await controls.setColumnChecked('PDisks');
        await controls.closeColumnSetup();
        await table.waitForTableData();
        const row = page.getByRole('row').filter({
            has: page.getByText('popup-node-1', {exact: true}),
        });
        const control = row
            .locator(disk === 'PDisk' ? '.pdisk-storage__content' : '.pdisk-storage__vdisks-item a')
            .first();
        await control.hover();
        const action = page.getByRole('link', {name: `Go to ${disk}`, exact: true});
        await expect(action).toBeVisible();
        const scroll = page.locator('.ydb-cluster');
        await expect(action).toHaveAttribute('href', /nodeId=1/);
        expect(await action.evaluate((element) => Boolean(element.closest('.ydb-cluster')))).toBe(
            true,
        );
        if (height === 320) {
            const popup = page.locator('.ydb-popover').filter({has: action});
            await expect
                .poll(() =>
                    popup.evaluate((element) => element.scrollHeight - element.clientHeight),
                )
                .toBeGreaterThan(0);
            await popup.hover({position: {x: 20, y: 20}});
            const before = await scroll.evaluate((element) => element.scrollTop);
            await page.mouse.wheel(0, 50);
            await expect
                .poll(() => popup.evaluate((element) => element.scrollTop))
                .toBeGreaterThan(0);
            expect(await scroll.evaluate((element) => element.scrollTop)).toBe(before);
        }
        await action.hover();
        const initialScroll = await scroll.evaluate((element) => element.scrollTop);
        const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        await page.mouse.wheel(0, 200);
        await expect
            .poll(() => scroll.evaluate((element) => element.scrollTop))
            .toBeGreaterThan(initialScroll);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(pageWidth);
    });
}
