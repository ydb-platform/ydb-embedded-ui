import {expect, test} from '@playwright/test';

import {storagePage} from '../../utils/constants';

import {ALL_GREEN_VDISK_INDEX, createMockStorageGroupsResponse} from './mockStorageGroups';
import {DATABASE, setupVDiskColoringMocks} from './vdiskColoringMocks';

const names = Array.from({length: 36}, (_, index) => `DC-${String(index + 1).padStart(2, '0')}`);

function createPaletteGroups() {
    const response = createMockStorageGroupsResponse();
    const template = response.StorageGroups?.[0];
    const disk = template?.VDisks?.[ALL_GREEN_VDISK_INDEX];
    if (!template || !disk?.PDisk || !disk.Whiteboard) {
        throw new Error('The palette fixture requires a complete disk');
    }
    response.StorageGroups = Array.from({length: 12}, (_group, groupIndex) => {
        const groupId = 9000000000 + groupIndex;
        return {
            ...template,
            GroupId: String(groupId),
            VDisks: Array.from({length: 3}, (_, slot) => {
                const index = groupIndex * 3 + slot;
                const nodeId = 8000 + index;
                return {
                    ...disk,
                    NodeId: nodeId,
                    VDiskId: `${groupId}-1-0-0-${slot}`,
                    Whiteboard: {
                        ...disk.Whiteboard,
                        NodeId: nodeId,
                        VDiskId: {
                            GroupID: groupId,
                            GroupGeneration: 1,
                            Ring: 0,
                            Domain: 0,
                            VDisk: slot,
                        },
                    },
                    PDisk: {
                        ...disk.PDisk,
                        PDiskId: `${nodeId}-1`,
                        Whiteboard: {...disk.PDisk?.Whiteboard, NodeId: nodeId, PDiskId: 1},
                    },
                };
            }),
        };
    });
    response.TotalGroups = response.FoundGroups = 12;
    return response;
}

for (const theme of ['light', 'dark']) {
    test(`shows all 36 datacenter disk colors and hover states in ${theme} theme`, async ({
        page,
    }) => {
        await setupVDiskColoringMocks(page, createPaletteGroups());
        await page.route('**/viewer/json/nodelist?*', (route) =>
            route.fulfill({
                json: names.map((name, index) => ({
                    Id: 8000 + index,
                    Location: {DataCenter: name},
                })),
            }),
        );
        await page.route('**/viewer/json/cluster?*', (route) =>
            route.fulfill({json: {DataCenters: names}}),
        );
        await page.addInitScript((value) => {
            localStorage.setItem('theme', value);
            localStorage.setItem('enableStorageExpertMode', 'true');
            localStorage.setItem('storageExpertMode', 'true');
            localStorage.setItem(
                'storageGroupsSelectedColumns',
                JSON.stringify([
                    {id: 'GroupId', selected: true},
                    {id: 'VDisksPDisks', selected: true},
                ]),
            );
        }, theme);
        await page.setViewportSize({width: 1400, height: 1100});
        const url = new URL(storagePage, 'http://localhost');
        for (const [key, value] of Object.entries({
            database: DATABASE,
            type: 'groups',
            storageExpertMode: '1',
            vdisksGroupBy: 'DC',
            pdisksGroupBy: 'DC',
        })) {
            url.searchParams.set(key, value);
        }
        const groupsLoaded = page.waitForResponse((response) =>
            response.url().includes('/storage/groups?'),
        );
        await page.goto(url.pathname + url.search);
        await groupsLoaded;
        const rows = page.locator('.ydb-paginated-table__row');
        await expect(rows).toHaveCount(12);
        const bars = rows.locator('.storage-disk-progress-bar_mode-datacenter');
        await expect(bars).toHaveCount(72);
        for (const kind of ['vdisk', 'pdisk']) {
            const cards = rows.locator(`.ydb-storage-disks__${kind}-item`);
            await expect(cards.getByRole('link')).toHaveText(names);
            const appearances = await cards
                .locator('.storage-disk-progress-bar')
                .evaluateAll((elements) =>
                    elements.map((element) => {
                        const style = getComputedStyle(element);
                        return [style.backgroundColor, style.color, style.boxShadow].join(';');
                    }),
                );
            expect(new Set(appearances).size).toBe(36);
        }
        await expect(rows.locator('.ydb-datacenter-color_color_neutral')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        const first = await rows.first().boundingBox();
        const last = await rows.last().boundingBox();
        if (!first || !last) {
            throw new Error('All palette rows must be visible');
        }
        const clip = {
            x: first.x,
            y: first.y,
            width: first.width,
            height: last.y + last.height - first.y,
        };
        await expect(page).toHaveScreenshot(`datacenter-disks-full-palette-${theme}.png`, {clip});
        const background = await bars
            .first()
            .evaluate((element) => getComputedStyle(element).backgroundColor);
        await bars.first().hover();
        await expect(bars.first()).not.toHaveCSS('background-color', background);
        await page.mouse.move(0, 0);
        await expect(bars.first()).toHaveCSS('background-color', background);
        // Exercise the same product class as pointer hover for every swatch in one snapshot.
        await bars.evaluateAll((elements) => {
            elements.forEach((element) =>
                element.classList.add('storage-disk-progress-bar_highlighted'),
            );
        });
        await expect(page).toHaveScreenshot(`datacenter-disks-full-palette-hover-${theme}.png`, {
            clip,
        });
    });
}
