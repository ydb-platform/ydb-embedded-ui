import {expect, test} from '@playwright/test';

import {storagePage} from '../../utils/constants';

import {createMockStorageGroupsResponse} from './mockStorageGroups';
import {DATABASE, setupVDiskColoringMocks} from './vdiskColoringMocks';

for (const theme of ['light', 'dark']) {
    test(`shows the actual hidden datacenters for both legends in ${theme} theme`, async ({
        page,
    }) => {
        const names = Array.from(
            {length: 36},
            (_, index) => `DC-${String(index + 1).padStart(2, '0')}`,
        );
        const groups = createMockStorageGroupsResponse();
        const nodeIds = [
            ...new Set(
                groups.StorageGroups?.flatMap(
                    (group) => group.VDisks?.map((disk) => disk.NodeId) ?? [],
                ).filter((nodeId) => nodeId !== undefined),
            ),
        ];
        await setupVDiskColoringMocks(page, groups);
        await page.route('**/viewer/json/nodelist?*', (route) =>
            route.fulfill({
                json: names.map((name, index) => ({
                    Id: nodeIds[index] ?? 1000 + index,
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
        }, theme);
        await page.setViewportSize({width: 1400, height: 900});
        const url = new URL(storagePage, 'http://localhost');
        url.searchParams.set('database', DATABASE);
        url.searchParams.set('type', 'groups');
        url.searchParams.set('storageExpertMode', '1');
        url.searchParams.set('vdisksGroupBy', 'DC');
        url.searchParams.set('pdisksGroupBy', 'DC');
        await page.goto(url.pathname + url.search);
        await page.evaluate(() => document.fonts.ready);

        const hiddenCounts: number[] = [];
        for (const kind of ['vdisk', 'pdisk']) {
            const legend = page.getByTestId(`${kind}-datacenter-legend`);
            const more = legend.getByRole('button', {name: /Show \d+ more datacenters/});
            await expect(more).toBeVisible();
            await more.click();
            const popover = page.getByTestId(`${kind}-datacenter-popover`);
            await expect(popover).toBeVisible();
            const labels = popover.locator('.ydb-datacenter-label');
            const hiddenCount = Number((await more.innerText()).match(/\d+/)?.[0]);
            hiddenCounts.push(hiddenCount);
            expect(hiddenCount).toBeGreaterThan(0);
            await expect(labels).toHaveCount(hiddenCount);
            const visibleNames = await legend
                .locator('.ydb-datacenter-legend__visible > .ydb-datacenter-label')
                .allTextContents();
            const hiddenNames = await labels.allTextContents();
            expect([...visibleNames, ...hiddenNames].sort()).toEqual([...names, 'Unknown'].sort());
            await expect(popover).toHaveScreenshot(`${kind}-datacenter-overflow-${theme}.png`);
            await popover.getByRole('button', {name: /Close additional datacenters/}).click();
            await expect(popover).toBeHidden();
            await more.focus();
            await page.keyboard.press('Enter');
            await expect(popover).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(popover).toBeHidden();
            await expect(more).toBeFocused();
        }

        await page.setViewportSize({width: 1000, height: 900});
        for (const [index, kind] of ['vdisk', 'pdisk'].entries()) {
            const more = page
                .getByTestId(`${kind}-datacenter-legend`)
                .getByRole('button', {name: /Show \d+ more datacenters/});
            await expect
                .poll(async () => Number((await more.innerText()).match(/\d+/)?.[0]))
                .toBeGreaterThan(hiddenCounts[index]);
        }
        await page.setViewportSize({width: 3800, height: 900});
        for (const kind of ['vdisk', 'pdisk']) {
            const legend = page.getByTestId(`${kind}-datacenter-legend`);
            await expect(
                legend.getByRole('button', {name: /Show \d+ more datacenters/}),
            ).toHaveCount(0);
            await expect(
                legend.locator('.ydb-datacenter-legend__visible > .ydb-datacenter-label'),
            ).toHaveCount(37);
        }
    });
}
