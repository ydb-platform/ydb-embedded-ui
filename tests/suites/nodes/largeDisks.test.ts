import {expect, test} from '@playwright/test';

import {ClusterNodesTable} from '../paginatedTable/paginatedTable';

import {NodesPage} from './NodesPage';
import {setupLargeDisksMock} from './largeDisksMocks';

test('bounds rendering while preserving visible disks on resize', async ({page}) => {
    await setupLargeDisksMock(page, 1);
    const nodesPage = new NodesPage(page);
    await nodesPage.goto();
    await expect(nodesPage.getPDiskLink(1, 4)).toBeVisible();
    await expect.poll(() => page.locator('.ydb-vdisk-component').count()).toBeLessThan(100);

    const vDisk = nodesPage.getVDiskLink(1, '1020-1-0-0-0');
    await vDisk.hover();
    const popup = page.locator('.ydb-popover').filter({visible: true});
    await expect(popup).toContainText('1020-1-0-0-0');
    await page.mouse.move(0, 0);
    await expect(popup).toHaveCount(0);

    await page.setViewportSize({width: 800, height: 720});
    await expect(nodesPage.getPDiskLink(1, 4)).toHaveCount(0);
    await page.setViewportSize({width: 1280, height: 720});
    await expect(nodesPage.getPDiskLink(1, 4)).toBeVisible();
});

test('keeps keyboard navigation across offscreen disks', async ({page, browserName}) => {
    // Safari on macOS uses Option+Tab to include links in keyboard navigation.
    const modifier = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+' : '';
    await setupLargeDisksMock(page, 2, {pDisksPerNode: 8, vDisksPerPDisk: 2});
    const nodesPage = new NodesPage(page);
    await nodesPage.goto();
    await page.setViewportSize({width: 800, height: 720});
    const precedingButton = nodesPage.getHostCopyButton('host-0.test');
    await precedingButton.focus();
    const links = Array.from({length: 8}, (_, index) => [
        nodesPage.getVDiskLink(1, `${1000 + index * 2}-1-0-0-0`),
        nodesPage.getVDiskLink(1, `${1001 + index * 2}-1-0-0-0`),
        nodesPage.getPDiskLink(1, index + 1),
    ]).flat();
    for (const link of links) {
        await page.keyboard.press(`${modifier}Tab`);
        await expect(link).toBeFocused();
        await expect(link).toBeInViewport();
    }
    await page.keyboard.press(`${modifier}Tab`);
    await expect(page.getByRole('link', {name: 'host-1.test', exact: true})).toBeFocused();
    for (const link of links.toReversed()) {
        await page.keyboard.press(`${modifier}Shift+Tab`);
        await expect(link).toBeFocused();
        await expect(link).toBeInViewport();
    }
    await page.keyboard.press(`${modifier}Shift+Tab`);
    await expect(precedingButton).toBeFocused();
});

test('does not reopen a disk popup after scrolling away and back', async ({page}) => {
    await setupLargeDisksMock(page, 1);
    const nodesPage = new NodesPage(page);
    await nodesPage.goto();
    const disk = nodesPage.getPDiskLink(1, 3);
    await disk.hover();
    const popup = page.locator('.ydb-popover').filter({visible: true});
    await expect(popup).toContainText('/dev/disk-3');
    await nodesPage.scrollDisksToEnd();
    await page.mouse.move(0, 0);
    await expect(popup).toHaveCount(0);
    await nodesPage.scrollDisksToStart();
    await expect(disk).toBeInViewport();
    await expect(popup).toHaveCount(0);
});

test('cancels pending disk hover when the row rerenders', async ({page}) => {
    await setupLargeDisksMock(page, 1);
    const nodesPage = new NodesPage(page);
    await nodesPage.goto();
    const disk = nodesPage.getPDiskLink(1, 3);
    await expect(disk).toBeInViewport();
    await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));

    await disk.hover();
    await page.clock.runFor(100);
    await nodesPage.getPDiskLink(1, 1).focus();
    await page.mouse.move(0, 0);
    await page.clock.runFor(150);
    const popup = page.locator('.ydb-popover').filter({visible: true});
    await expect(popup).toHaveCount(0);

    await disk.hover();
    await nodesPage.getPDiskLink(1, 2).focus();
    await page.clock.runFor(250);
    await expect(popup).toContainText('/dev/disk-3');
});

for (const diskType of ['PDisk', 'VDisk']) {
    test(`finishes closing a ${diskType} popup when its disk leaves the viewport`, async ({
        page,
    }) => {
        await setupLargeDisksMock(page, 1);
        const nodesPage = new NodesPage(page);
        await nodesPage.goto();
        const disk = nodesPage.getPDiskLink(1, 4);
        await expect(disk).toBeInViewport();
        await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
        await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
        const popup = page.locator('.ydb-popover').filter({visible: true});

        const target = diskType === 'PDisk' ? disk : nodesPage.getVDiskLink(1, '1030-1-0-0-0');
        await target.hover();
        await page.clock.runFor(250);
        await expect(popup).toContainText(diskType === 'PDisk' ? '/dev/disk-4' : '1030-1-0-0-0');
        await page.mouse.move(0, 0);
        await page.setViewportSize({width: 800, height: 720});
        await expect(disk).not.toBeInViewport();
        await page.clock.resume();
        await expect(disk).toHaveCount(0);
        await page.setViewportSize({width: 1280, height: 720});
        await expect(disk).toBeInViewport();
        await nodesPage.getPDiskLink(1, 1).focus();
        await expect(popup).toHaveCount(0);
    });
}

test('clears popup state when a disk disappears from refreshed data', async ({page}) => {
    const mock = await setupLargeDisksMock(page, 1);
    const nodesPage = new NodesPage(page);
    const table = new ClusterNodesTable(page);
    await nodesPage.goto();
    const disk = nodesPage.getPDiskLink(1, 4);
    await expect(disk).toBeInViewport();
    await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    const popup = page.locator('.ydb-popover').filter({visible: true});

    await disk.hover();
    await page.clock.runFor(250);
    await expect(popup).toContainText('/dev/disk-4');
    mock.setDisksPresent(false);
    await table.getControls().clickRefreshButton();
    await page.clock.runFor(100);
    await expect(disk).toHaveCount(0);
    await page.clock.runFor(250);

    mock.setDisksPresent(true);
    await table.getControls().clickRefreshButton();
    await page.clock.runFor(100);
    await expect(disk).toBeInViewport();
    await nodesPage.getPDiskLink(1, 1).focus();
    await expect(popup).toHaveCount(0);
});

test('tracks the correct disks after data is reordered on refresh', async ({page}) => {
    const mock = await setupLargeDisksMock(page, 1);
    const nodesPage = new NodesPage(page);
    const table = new ClusterNodesTable(page);
    await nodesPage.goto();
    await expect(nodesPage.getPDiskLink(1, 3)).toBeInViewport();

    mock.reversePDisks();
    await table.getControls().clickRefreshButton();
    await expect(nodesPage.getPDiskLink(1, 64)).toBeInViewport();
    await nodesPage.getVDiskLink(1, '1630-1-0-0-0').hover();
    const popup = page.locator('.ydb-popover').filter({visible: true});
    await expect(popup).toContainText('1630-1-0-0-0');
    await page.mouse.move(0, 0);
    await expect(popup).toHaveCount(0);

    await nodesPage.scrollDisksToEnd();
    await expect(nodesPage.getPDiskLink(1, 2)).toBeInViewport();
    await expect(nodesPage.getVDiskLink(1, '1010-1-0-0-0')).toBeInViewport();
});

test('preserves keyboard focus when auto-refresh reorders disks', async ({page, browserName}) => {
    const modifier = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+' : '';
    const mock = await setupLargeDisksMock(page, 1);
    const nodesPage = new NodesPage(page);
    const table = new ClusterNodesTable(page);
    await nodesPage.goto();
    await table.waitForTableData();
    const disk = nodesPage.getPDiskLink(1, 3);
    await expect(disk).toBeInViewport();
    await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await table.getControls().setRefreshInterval('15 sec');
    await disk.focus();
    await expect(disk).toBeFocused();

    mock.reversePDisks();
    await page.clock.runFor(15_000);
    // Let the table's request-batching timer finish after the polling interval fires.
    await page.clock.resume();
    await expect(
        nodesPage.table.locator('.ydb-storage-pdisks__pdisks-item').first(),
    ).toHaveAttribute('data-disk-id', '1-66');
    await expect(disk).toBeFocused();

    await page.keyboard.press(`${modifier}Tab`);
    const nextDisk = nodesPage.getVDiskLink(1, '1010-1-0-0-0');
    await expect(nextDisk).toBeFocused();
    await expect(nextDisk).toBeInViewport();
    await page.keyboard.press(`${modifier}Shift+Tab`);
    await expect(disk).toBeFocused();
});

test('keeps disk rendering bounded when scrolling a large Nodes table', async ({page}) => {
    await setupLargeDisksMock(page);
    const nodesPage = new NodesPage(page);
    const table = new ClusterNodesTable(page);
    await nodesPage.goto();
    await table.waitForTableData();
    await expect(page.getByRole('link', {name: 'host-0.test', exact: true})).toBeVisible();

    const disks = page.locator('.ydb-vdisk-component');
    const checkpoints = [];
    // A viewport contains only a small fraction of 66 PDisks x 10 VDisks per node.
    await expect.poll(() => disks.count()).toBeGreaterThan(0);
    await expect.poll(() => disks.count()).toBeLessThan(4000);
    checkpoints.push({position: 'top', ...(await nodesPage.getDiskRenderingStats())});

    await nodesPage.scrollDisksToEnd();
    const lastPDisk = nodesPage.getPDiskLink(1, 66);
    await expect(lastPDisk).toBeInViewport();
    await expect(nodesPage.getPDiskLink(1, 65)).toBeInViewport();
    await expect(nodesPage.getVDiskLink(1, '1640-1-0-0-0')).toBeInViewport();
    await lastPDisk.hover();
    await expect(page.locator('.ydb-popover').filter({visible: true})).toContainText(
        '/dev/disk-66',
    );
    await page.mouse.move(0, 0);

    await nodesPage.scrollDisksToStart();
    await table.scrollToPosition(5100);
    await expect(nodesPage.getVDiskLink(101, '101020-1-0-0-0')).toBeInViewport();
    await expect.poll(() => disks.count()).toBeLessThan(4000);
    checkpoints.push({position: 'middle', ...(await nodesPage.getDiskRenderingStats())});

    await table.scrollToBottom();
    const lastHost = page.getByRole('link', {name: 'host-199.test', exact: true});
    await expect(lastHost).toBeInViewport();
    await nodesPage.scrollDisksToEnd();
    await expect(nodesPage.getPDiskLink(200, 66)).toBeInViewport();
    await expect(nodesPage.getVDiskLink(200, '200640-1-0-0-0')).toBeInViewport();
    await expect.poll(() => disks.count()).toBeLessThan(4000);
    checkpoints.push({position: 'bottom', ...(await nodesPage.getDiskRenderingStats())});

    await nodesPage.scrollDisksToStart();
    await table.scrollToPosition(0);
    await expect(nodesPage.getPDiskLink(1, 1)).toBeInViewport();
    await expect(nodesPage.getVDiskLink(1, '1020-1-0-0-0')).toBeInViewport();
    await expect.poll(() => disks.count()).toBeLessThan(4000);
    checkpoints.push({position: 'back', ...(await nodesPage.getDiskRenderingStats())});
    await test.info().attach('disk-rendering-counts', {
        body: JSON.stringify(checkpoints),
        contentType: 'application/json',
    });
    await page.screenshot({path: test.info().outputPath('large-nodes-disks.png')});
});
