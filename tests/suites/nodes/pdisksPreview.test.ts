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
// Linux ARM64 and x64 round translucent disk colors differently by 1–2 RGB levels.
// Keep exact palette comparisons against a baseline from the same architecture.
const paletteArchitecture = process.platform === 'linux' ? `-${process.arch}` : '';

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
    test(`preview palette in ${theme} theme`, async ({page}) => {
        const nodes = await setupPDiskPreviewMocks(page, 1, 4);
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
        await page.mouse.move(0, 0);
        const previews = page.locator(previewSelector);
        await expect(previews).toHaveCount(4);
        const area = page.locator('.ydb-storage-pdisks-preview');
        await area.scrollIntoViewIfNeeded();
        const box = await area.boundingBox();
        assert(box);
        const clip = {x: box.x, y: box.y - 1, width: box.width, height: box.height + 2};
        // Tiny translucent squares need exact comparison to catch missing color layers.
        await expect(page).toHaveScreenshot(
            `pdisk-preview-palette-${theme}${paletteArchitecture}.png`,
            {
                clip,
                threshold: 0,
                maxDiffPixels: 0,
            },
        );

        // As in vdiskColoring.test.ts, force every tone's hover state for one stable snapshot.
        await previews.locator('.ydb-storage-pdisks-preview__color').evaluateAll((elements) => {
            elements.forEach((element) =>
                element.classList.add('ydb-storage-pdisks-preview__color_highlighted'),
            );
        });
        await expect(page).toHaveScreenshot(
            `pdisk-preview-palette-${theme}-hover${paletteArchitecture}.png`,
            {
                clip,
                threshold: 0,
                maxDiffPixels: 0,
            },
        );
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
    await preview.focus();
    await preview.press('Enter');
    const details = page.locator('.pdisk-storage__content');
    await expect(details).toBeVisible();
    await expect(details.locator('.storage-disk-progress-bar')).not.toHaveClass(/_highlighted/);
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
    await expect(preview).toBeFocused();
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

test('expanded disks remain interactive beyond the compact column boundary', async ({page}) => {
    await setupPDiskPreviewMocks(page);
    await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
    await openNodeDisks(page);
    const preview = page.getByRole('button', {name: 'Show PDisk 1-1 details', exact: true});
    const cell = preview.locator('xpath=ancestor::td');
    const cellBox = await cell.boundingBox();
    assert(cellBox);
    await preview.click();
    const lastVDisk = page.locator('.pdisk-storage__vdisks-item').last();
    await expect(lastVDisk).toBeVisible();
    const diskBox = await lastVDisk.boundingBox();
    assert(diskBox);
    expect(diskBox.x + diskBox.width / 2).toBeGreaterThan(cellBox.x + cellBox.width);
    expect(
        await lastVDisk.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return element.contains(
                document.elementFromPoint(rect.right - 1, rect.top + rect.height / 2),
            );
        }),
    ).toBe(true);
    await lastVDisk.hover();
    await expect(page.getByRole('link', {name: 'Go to VDisk', exact: true})).toBeVisible();
    await lastVDisk.click();
    await expect(preview).toBeVisible();
});

test('Enter repeatedly expands and collapses the same disk without losing focus', async ({
    page,
}) => {
    await setupPDiskPreviewMocks(page, 2);
    await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
    await openNodeDisks(page);
    const preview = page.getByRole('button', {name: 'Show PDisk 2-1 details', exact: true});
    const details = page.locator('.pdisk-storage__content');
    const initialUrl = page.url();
    await preview.focus();
    for (let cycle = 0; cycle < 3; cycle++) {
        await page.keyboard.press('Enter');
        await expect(details).toBeFocused();
        await expect(details).toHaveAttribute('href', /nodeId=2/);
        await page.keyboard.press('Enter');
        await expect(preview).toBeFocused();
        await expect(details).toHaveCount(0);
    }
    // Collapsing from a VDisk should return to the same preview as well.
    await page.keyboard.press('Enter');
    await page.locator('.pdisk-storage__vdisks-item a').last().focus();
    await page.keyboard.press('Enter');
    await expect(preview).toBeFocused();
    expect(page.url()).toBe(initialUrl);
});

test('mouse expansion and collapse do not transfer focus to the new control', async ({page}) => {
    await setupPDiskPreviewMocks(page);
    await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
    await openNodeDisks(page);
    const preview = page.getByRole('button', {name: 'Show PDisk 1-1 details', exact: true});
    const details = page.locator('.pdisk-storage__content');
    await preview.click();
    await expect(details).toBeVisible();
    await expect(details).not.toBeFocused();
    await details.click();
    await expect(preview).toBeVisible();
    await expect(preview).not.toBeFocused();
});

test('later chunks widen previews when backend-wide disk maxima are absent', async ({page}) => {
    const nodes = await setupPDiskPreviewMocks(page, 240, 4);
    for (const node of nodes.slice(0, 100)) {
        node.PDisks = node.PDisks.slice(0, 1);
        node.VDisks = node.VDisks.filter((disk) => disk.PDiskId === 1);
    }
    await page.route('**/viewer/json/nodes?**', async (route) => {
        const url = new URL(route.request().url());
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const limit = Number(url.searchParams.get('limit') ?? nodes.length);
        await route.fulfill({
            json: {
                TotalNodes: String(nodes.length),
                FoundNodes: String(nodes.length),
                Nodes: nodes.slice(offset, offset + limit),
            },
        });
    });
    await page.setViewportSize({width: 1280, height: 600});
    await page.addInitScript(() => localStorage.setItem('enablePDisksPreview', 'true'));
    const table = await openNodeDisks(page);
    const column = page.getByRole('columnheader', {name: 'PDisks', exact: true});
    const width = () => column.evaluate((element) => element.getBoundingClientRect().width);
    const initialWidth = await width();
    await table.scrollToPosition(5100);
    await expect(
        page.getByRole('button', {name: 'Show PDisk 101-4 details', exact: true}),
    ).toBeVisible();
    await expect.poll(width).toBeGreaterThan(initialWidth);
    const expandedWidth = await width();
    await table.scrollToPosition(0);
    await expect(
        page.getByRole('button', {name: 'Show PDisk 1-1 details', exact: true}),
    ).toBeVisible();
    expect(await width()).toBe(expandedWidth);
});
