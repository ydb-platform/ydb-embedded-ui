import {expect, test} from '@playwright/test';

import {getClipboardContent} from '../../utils/clipboard';

import {setupDatacenterDiskMocks} from './datacenterMocks';
import {NODE_ID, PDISK_ID, VDISK_PAGE_PATH} from './vdiskPageMocks';

for (const theme of ['light', 'dark']) {
    for (const kind of ['vdisk', 'pdisk']) {
        test(`uses a datacenter label on the ${kind} page in ${theme} theme`, async ({page}) => {
            await page.setViewportSize({width: 1400, height: 900});
            const {nodeListRequests} = await setupDatacenterDiskMocks(page, theme);
            await page.goto(
                kind === 'vdisk' ? VDISK_PAGE_PATH : `/pDisk?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}`,
            );
            const field = page.getByTestId(`${kind}-location-datacenter`);
            const label = field.locator('.ydb-datacenter-label');
            await expect(label).toHaveText('DC-A');
            await expect(label).toHaveClass(/ydb-datacenter-color_color_turquoise/);
            await expect(label).toHaveCSS('height', '18px');
            await page.evaluate(() => document.fonts.ready);
            await expect(field).toHaveScreenshot(`${kind}-datacenter-details-${theme}.png`);
            await field.getByRole('button', {name: 'Copy Datacenter', exact: true}).click();
            await expect.poll(() => getClipboardContent(page)).toBe('dc-a');
            expect(nodeListRequests).toHaveLength(1);
        });
    }
}
