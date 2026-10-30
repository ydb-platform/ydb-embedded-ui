import {expect, test} from '@playwright/test';

import {setupDatacenterDiskMocks} from './datacenterMocks';
import {NODE_ID, PDISK_ID, VDISK_PAGE_PATH, setupPDiskInfoMock} from './vdiskPageMocks';

for (const theme of ['light', 'dark']) {
    test(`colors the donor tooltip from sysinfo without nodelist metadata in ${theme} theme`, async ({
        page,
    }) => {
        await page.setViewportSize({width: 1500, height: 1000});
        const {nodeListRequests} = await setupDatacenterDiskMocks(page, theme, false);
        await setupPDiskInfoMock(page, {withSlotOnlyDonor: true});
        await page.goto(`/pDisk?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}`);
        await page.locator('.ydb-pdisk-space-distribution__slot-wrapper a').first().hover();
        const popup = page
            .locator('.ydb-pdisk-space-distribution__vdisk-popup')
            .filter({visible: true});
        const label = popup.locator('.ydb-datacenter-label');
        await expect(label).toHaveText('DC-A');
        await expect(label).toHaveClass(/ydb-datacenter-color_color_turquoise/);
        await expect(label).not.toHaveClass(/ydb-datacenter-color_color_neutral/);
        await page.evaluate(() => document.fonts.ready);
        await expect(popup.locator('.ydb-disk-popup__location')).toHaveScreenshot(
            `donor-datacenter-tooltip-${theme}.png`,
        );
        expect(nodeListRequests).toHaveLength(1);
    });

    test(`uses datacenter labels in both disk tooltips in ${theme} theme`, async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        const {nodeListRequests} = await setupDatacenterDiskMocks(page, theme);
        await page.goto(VDISK_PAGE_PATH);

        for (const [kind, title] of [
            ['vdisk', 'VDisk'],
            ['pdisk', 'PDisk'],
        ] as const) {
            const disk = page
                .locator(`.ydb-storage-disks__${kind}-item .storage-disk-progress-bar`)
                .first();
            await disk.hover();
            const popup = page
                .locator('.ydb-disk-popup')
                .filter({has: page.getByRole('link', {name: `Go to ${title}`, exact: true})})
                .filter({visible: true})
                .last();
            const panel = popup
                .locator('.ydb-disk-popup__panel')
                .filter({has: page.getByText(title, {exact: true})});
            const label = panel.locator('.ydb-datacenter-label');
            await expect(label).toHaveText('DC-A');
            await expect(label).toHaveClass(/ydb-datacenter-color_color_turquoise/);
            await expect(label).toHaveCSS('height', '18px');
            await expect(panel.getByText('pile-a', {exact: true})).toBeVisible();
            await page.evaluate(() => document.fonts.ready);
            await expect(panel.locator('.ydb-disk-popup__location')).toHaveScreenshot(
                `${kind}-datacenter-tooltip-${theme}.png`,
            );
            await page.mouse.move(0, 0);
            await expect(popup).toBeHidden();
        }
        expect(nodeListRequests).toHaveLength(1);
    });
}
