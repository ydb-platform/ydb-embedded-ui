import assert from 'node:assert/strict';

import type {Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {EFlag} from '../../../src/types/api/enums';
import {TPDiskState} from '../../../src/types/api/pdisk';
import {EVDiskState} from '../../../src/types/api/vdisk';
import type {TVDiskStateInfo} from '../../../src/types/api/vdisk';
import {ClusterNodesTable} from '../paginatedTable/paginatedTable';
import {Sidebar} from '../sidebar/Sidebar';

import {NodesPage} from './NodesPage';
import {setupPDiskPreviewMocks} from './pdisksPreviewMocks';

const settingTitle = 'Compact PDisk previews';
const previewSelector = '.ydb-storage-pdisks-preview__control';

async function openNodeDisks(page: Page) {
    await new NodesPage(page).goto({clusterName: 'preview-test', backend: 'https://preview.test'});
    const table = new ClusterNodesTable(page);
    const controls = table.getControls();
    await controls.openColumnSetup();
    await controls.setColumnChecked('PDisks');
    await controls.closeColumnSetup();
    await expect(page.getByRole('columnheader', {name: 'PDisks', exact: true})).toBeVisible();
    await table.waitForTableData();
    return table;
}

for (const theme of ['light', 'dark']) {
    test(`preview and detail palette in ${theme} theme`, async ({page}) => {
        const nodes = await setupPDiskPreviewMocks(page, 2, 4);
        const pDiskStates = [
            TPDiskState.Normal,
            TPDiskState.Initial,
            TPDiskState.Stopped,
            undefined,
        ];
        const vDiskStates: Partial<TVDiskStateInfo>[] = [
            {},
            {DiskSpace: EFlag.Yellow},
            {VDiskState: EVDiskState.PDiskError},
            {Replicated: false},
            {VDiskState: undefined},
            {DonorMode: true},
        ];
        for (const node of nodes) {
            node.PDisks = node.PDisks.map((disk, index) => ({...disk, State: pDiskStates[index]}));
            node.VDisks = node.VDisks.map((disk, index) => ({
                ...disk,
                ...vDiskStates[index % vDiskStates.length],
            }));
        }
        await page.addInitScript((themeName) => {
            localStorage.setItem('enablePDisksPreview', 'true');
            localStorage.setItem('theme', themeName);
        }, theme);
        await openNodeDisks(page);
        for (let diskId = 1; diskId <= 4; diskId++) {
            await page
                .getByRole('button', {name: `Show PDisk 2-${diskId} details`, exact: true})
                .press('Enter');
        }
        await page.mouse.move(0, 0);
        const previews = page.locator(previewSelector);
        const details = page.locator('.pdisk-storage');
        await expect(previews).toHaveCount(4);
        await expect(details).toHaveCount(4);
        await expect(details.locator('.storage-disk-progress-bar_highlighted')).toHaveCount(0);
        await expect(page.getByRole('link', {name: 'Go to PDisk', exact: true})).toHaveCount(0);

        const areas = page.locator('.ydb-storage-pdisks-preview');
        await areas.last().scrollIntoViewIfNeeded();
        await expect(details.last()).toBeInViewport({ratio: 1});
        const firstBox = await areas.first().boundingBox();
        const lastBox = await areas.last().boundingBox();
        assert(firstBox && lastBox);
        const clip = {
            x: firstBox.x,
            y: firstBox.y - 1,
            width: Math.max(firstBox.width, lastBox.width),
            height: lastBox.y + lastBox.height - firstBox.y + 2,
        };
        // Keep previews and their original controls together in the same reference image.
        // Tiny translucent squares need exact comparison to catch missing color layers.
        await expect(page).toHaveScreenshot(`pdisk-preview-palette-${theme}.png`, {
            clip,
            threshold: 0,
            maxDiffPixels: 0,
        });

        // As in vdiskColoring.test.ts, force every tone's hover state for one stable snapshot.
        await previews.locator('.ydb-storage-pdisks-preview__color').evaluateAll((elements) => {
            elements.forEach((element) =>
                element.classList.add('ydb-storage-pdisks-preview__color_highlighted'),
            );
        });
        await details.locator('.storage-disk-progress-bar').evaluateAll((elements) => {
            elements.forEach((element) =>
                element.classList.add('storage-disk-progress-bar_highlighted'),
            );
        });
        await expect(page).toHaveScreenshot(`pdisk-preview-palette-${theme}-hover.png`, {
            clip,
            threshold: 0,
            maxDiffPixels: 0,
        });
    });
}

test('experiment defaults to old controls and switches both rendering and column width', async ({
    page,
}) => {
    await setupPDiskPreviewMocks(page);
    await openNodeDisks(page);
    const preview = page.locator(previewSelector);
    const original = page.locator('.ydb-storage-pdisks__pdisks-wrapper');
    const column = page.getByRole('columnheader', {name: 'PDisks', exact: true});
    await expect(original).toBeVisible();
    await expect(preview).toHaveCount(0);
    const originalWidth = await column.evaluate((element) => element.getBoundingClientRect().width);
    const initialDocument = await page.evaluateHandle(() => document);
    const url = page.url();

    const sidebar = new Sidebar(page);
    await sidebar.clickSettings();
    await sidebar.clickExperimentsSection();
    expect(await sidebar.isExperimentEnabled(settingTitle)).toBe(false);
    await sidebar.toggleExperimentByTitle(settingTitle);
    await sidebar.closeDrawer();
    await expect(preview).toBeVisible();
    await expect(original).toHaveCount(0);
    await expect
        .poll(async () => await column.evaluate((element) => element.getBoundingClientRect().width))
        .toBeLessThan(originalWidth);
    expect(await initialDocument.evaluate((savedDocument) => savedDocument === document)).toBe(
        true,
    );
    await initialDocument.dispose();
    expect(page.url()).toBe(url);
    await page.reload();
    await expect(preview).toBeVisible();

    await sidebar.clickSettings();
    await sidebar.clickExperimentsSection();
    await sidebar.toggleExperimentByTitle(settingTitle);
    await sidebar.closeDrawer();
    await expect(original).toBeVisible();
    await expect(preview).toHaveCount(0);
    await expect
        .poll(async () => await column.evaluate((element) => element.getBoundingClientRect().width))
        .toBe(originalWidth);
    await page.reload();
    await expect(original).toBeVisible();
});

test('preview uses compact SVG, preserves row height, and keeps detail popups in the scroll container', async ({
    page,
}) => {
    await setupPDiskPreviewMocks(page);
    await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
    await openNodeDisks(page);
    const preview = page.getByRole('button', {name: 'Show PDisk 1-1 details', exact: true});
    await expect(preview).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(preview.locator('svg *')).toHaveCount(5);
    const row = preview.locator('xpath=ancestor::tr');
    expect(await row.evaluate((element) => element.getBoundingClientRect().height)).toBe(51);
    const border = await preview
        .locator('svg rect')
        .last()
        .evaluate((element) => getComputedStyle(element).stroke);
    await preview.focus();
    await preview.press('Enter');
    const details = page.locator('.pdisk-storage__content');
    await expect(details).toBeVisible();
    await expect(details.locator('.storage-disk-progress-bar')).not.toHaveClass(/_highlighted/);
    const detailBorder = await details.locator('.storage-disk-progress-bar').evaluate((element) => {
        const style = getComputedStyle(element);
        return style.borderTopStyle === 'none' ? 'none' : style.borderTopColor;
    });
    expect(detailBorder).toBe(border);
    expect(
        await details
            .locator('xpath=ancestor::tr')
            .evaluate((element) => element.getBoundingClientRect().height),
    ).toBe(51);

    await details.hover();
    const action = page.getByRole('link', {name: 'Go to PDisk', exact: true});
    await expect(action).toBeVisible();
    expect(
        await action.evaluate((element) => {
            const host = element.closest('.ydb-storage-pdisks-preview__popup-provider');
            const scrollContainer = host?.parentElement;
            return Boolean(
                scrollContainer &&
                    /(auto|scroll)/.test(getComputedStyle(scrollContainer).overflowY) &&
                    scrollContainer.querySelector('.ydb-paginated-table__table'),
            );
        }),
    ).toBe(true);
    await page.mouse.move(0, 0);
    await details.press('Enter');
    await expect(preview).toBeVisible();
    await expect(action).toHaveCount(0);
    await expect(preview.locator('.ydb-storage-pdisks-preview__color_highlighted')).toHaveCount(0);
});

test('15-second refresh updates open details, their popup and the collapsed preview', async ({
    page,
}) => {
    const [node] = await setupPDiskPreviewMocks(page);
    await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
    const table = await openNodeDisks(page);
    const preview = page.getByRole('button', {name: 'Show PDisk 1-1 details', exact: true});
    await expect(preview.locator('svg')).toHaveAttribute('width', '20');
    await table.getControls().setRefreshInterval('15 sec');
    await preview.click();
    const details = page.locator('.pdisk-storage__content');
    await expect(details).toHaveText('50%');
    await expect(page.locator('.pdisk-storage__vdisks-item')).toHaveCount(12);
    await details.hover();
    const popup = page
        .locator('.ydb-popover')
        .filter({has: page.getByRole('link', {name: 'Go to PDisk', exact: true})});
    await expect(popup.getByText('Normal', {exact: true})).toBeVisible();

    node.PDisks[0].State = TPDiskState.Stopped;
    node.PDisks[0].AvailableSize = '200000000';
    node.VDisks = node.VDisks.slice(0, 6).map((disk) => ({
        ...disk,
        VDiskState: EVDiskState.PDiskError,
    }));
    // Wait for the real polling interval without moving the pointer off the open disk.
    await expect(details).toHaveText('80%', {timeout: 20000});
    await expect(popup.getByText('Stopped', {exact: true})).toBeVisible();
    await expect(popup.getByText('Normal', {exact: true})).toHaveCount(0);
    await expect(page.locator('.pdisk-storage__vdisks-item')).toHaveCount(6);
    await expect(page.locator('.pdisk-storage__vdisks .storage-disk-progress-bar_red')).toHaveCount(
        6,
    );

    await details.click();
    await expect(popup).toHaveCount(0);
    await expect(preview.locator('svg')).toHaveAttribute('width', '13');
    await expect(preview.locator('.ydb-storage-pdisks-preview__pdisk-border')).toHaveClass(/_red/);
    const height = await preview
        .locator('.ydb-storage-pdisks-preview__pdisk-fill')
        .getAttribute('height');
    expect(Number(height)).toBeCloseTo(32.8);
});

for (const diskType of ['PDisk', 'VDisk'] as const) {
    test(`refresh removes the popup of a deleted ${diskType}`, async ({page}) => {
        const [node] = await setupPDiskPreviewMocks(page);
        await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
        const table = await openNodeDisks(page);
        await table.getControls().setRefreshInterval('15 sec');
        await page.getByRole('button', {name: 'Show PDisk 1-1 details', exact: true}).click();
        const disk =
            diskType === 'PDisk'
                ? page.locator('.pdisk-storage__content')
                : page.locator('.pdisk-storage__vdisks-item').last();
        await disk.hover();
        const action = page
            .getByRole('link', {name: `Go to ${diskType}`, exact: true})
            .and(
                page.locator(
                    diskType === 'PDisk' ? '[href*="pDiskId=1"]' : '[href*="vDiskId=12-1-0-0-0"]',
                ),
            );
        await expect(action).toBeVisible();
        // The cursor stays in place: closing must result from refreshed data, not mouseleave.
        if (diskType === 'PDisk') {
            node.PDisks = [];
            node.VDisks = [];
        } else {
            node.VDisks.pop();
        }
        await expect(action).toHaveCount(0, {timeout: 20000});
        await expect(page.locator('.pdisk-storage__vdisks-item')).toHaveCount(
            diskType === 'PDisk' ? 0 : 11,
        );
        if (diskType === 'PDisk') {
            await expect(page.locator('.ydb-storage-pdisks-preview__popup-provider')).toHaveCount(
                0,
            );
        } else {
            await expect(page.locator('.pdisk-storage__content')).toBeVisible();
        }
    });
}

for (const expanded of [false, true]) {
    test(`scrolling across chunks preserves node positions with ${expanded ? 'expanded' : 'collapsed'} disks`, async ({
        page,
    }) => {
        await setupPDiskPreviewMocks(page, 240);
        await page.setViewportSize({width: 1280, height: 600});
        await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
        const table = await openNodeDisks(page);
        const scroll = page.locator('.ydb-cluster');
        const firstRow = page.getByRole('row').filter({
            has: page.getByRole('link', {name: 'preview-node-1', exact: true}),
        });
        const initialRowY = await firstRow.evaluate((element) => element.getBoundingClientRect().y);
        const viewportY = await scroll.evaluate(
            (element) => element.getBoundingClientRect().y + element.clientHeight / 2,
        );

        // Both sides of 20-row boundaries, including chunks that replace already rendered rows.
        for (const nodeId of [40, 41, 42, 100, 101, 102, 200, 101, 41, 1]) {
            const position = Math.max(0, initialRowY + (nodeId - 1) * 51 - viewportY);
            await table.scrollToPosition(position);
            const preview = page.getByRole('button', {
                name: `Show PDisk ${nodeId}-1 details`,
                exact: true,
            });
            await expect(preview).toBeInViewport();
            await table.waitForTableData();
            const row = page.getByRole('row').filter({
                has: page.getByRole('link', {name: `preview-node-${nodeId}`, exact: true}),
            });
            const expectedY = initialRowY + (nodeId - 1) * 51 - position;
            await expect
                .poll(() => row.evaluate((element) => element.getBoundingClientRect().y))
                .toBe(expectedY);
            if (expanded) {
                await preview.press('Enter');
                await expect(row.locator('.pdisk-storage__content')).toBeVisible();
                expect(await row.evaluate((element) => element.getBoundingClientRect().y)).toBe(
                    expectedY,
                );
                expect(
                    await row.evaluate((element) => element.getBoundingClientRect().height),
                ).toBe(51);
            }
            expect(await scroll.evaluate((element) => element.scrollTop)).toBe(position);
        }
    });
}

test('wheel scrolling over a disk popup reaches the table', async ({page}) => {
    await setupPDiskPreviewMocks(page, 20);
    await page.setViewportSize({width: 1280, height: 600});
    await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
    await openNodeDisks(page);
    await page.getByRole('button', {name: 'Show PDisk 1-1 details', exact: true}).click();
    await page.locator('.pdisk-storage__content').hover();
    const action = page.getByRole('link', {name: 'Go to PDisk', exact: true});
    await action.hover();
    const host = page.locator('.ydb-storage-pdisks-preview__popup-provider');
    const scroll = host.locator('..');
    const initialScroll = await scroll.evaluate((element) => element.scrollTop);
    await page.mouse.wheel(0, 200);
    await expect
        .poll(() => scroll.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(initialScroll);
});
