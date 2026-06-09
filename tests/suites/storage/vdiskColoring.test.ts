import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {storagePage} from '../../utils/constants';

import {
    DATABASE,
    setupSpaceModeMocks,
    setupSpaceWithReplicationMocks,
    setupStateModeMocks,
} from './vdiskColoringMocks';

/**
 * Enable expert mode and new storage view
 */
async function enableExpertMode(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('enableStorageExpertMode', JSON.stringify(true)); // Global setting to enable expert mode
        localStorage.setItem('storageExpertMode', JSON.stringify(true)); // User's expert mode preference
    });
}

/**
 * Enable VDisks column in storage table
 */
async function enableVDisksWithPdisksColumn(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            'storageGroupsSelectedColumns',
            JSON.stringify([
                {id: 'GroupId', selected: true},
                {id: 'PoolName', selected: true},
                {id: 'Erasure', selected: true},
                {id: 'Used', selected: true},
                {id: 'VDisks', selected: true},
                {id: 'VDisksPDisks', selected: true}, // VDisks with PDisks column (replaces VDisks in expert mode)
            ]),
        );
    });
}

/**
 * Set VDisks groupBy mode in localStorage before page load
 */
async function setInitialVDisksGroupBy(page: Page, groupBy: 'State' | 'Space') {
    await page.addInitScript((groupByValue) => {
        localStorage.setItem('storageVDisksGroupBy', JSON.stringify(groupByValue));
    }, groupBy);
}

/**
 * Navigate to storage page and wait for data
 */
async function gotoStoragePage(page: Page) {
    const url = `${storagePage}?database=${DATABASE}&type=groups`;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
}

/**
 * Get VDisks container from the first row
 */
function getVDisksContainer(page: Page): Locator {
    return page
        .locator('.ydb-paginated-table__row')
        .first()
        .locator('.ydb-storage-disks > .g-box.g-flex')
        .first();
}

/**
 * Get all visible VDisk elements
 */
function getAllVDisks(container: Locator): Locator {
    return container.locator('.storage-disk-progress-bar');
}

/**
 * Set VDisks groupBy mode via URL parameter
 */
async function setVDisksGroupBy(page: Page, groupBy: 'State' | 'Space') {
    const currentUrl = page.url();
    const url = new URL(currentUrl);
    url.searchParams.set('storageVDisksGroupBy', groupBy);
    await page.goto(url.toString());
    await page.waitForLoadState('networkidle');
}

test.describe('VDisk Coloring - State Mode', () => {
    test.beforeEach(async ({page}) => {
        await enableExpertMode(page);
        await enableVDisksWithPdisksColumn(page);
        await setupStateModeMocks(page);
    });

    test('State mode - first group (replicated disks)', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'State');

        // First storage group row
        const firstGroupRow = page.locator('.ydb-paginated-table__row').first();
        const container = firstGroupRow.locator('.ydb-storage-disks > .g-box.g-flex').first();

        await expect(container).toBeVisible();

        // Wait for all disks to render
        const vDisks = container.locator('.storage-disk-progress-bar');
        await expect(vDisks.first()).toBeVisible();

        // Take screenshot of all disks in first group
        await expect(container).toHaveScreenshot('vdisk-state-mode-group1-replicated.png');
    });

    test('State mode - second group (replicating disks with donors)', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'State');

        // Second storage group row
        const secondGroupRow = page.locator('.ydb-paginated-table__row').nth(1);
        const container = secondGroupRow.locator('.ydb-storage-disks > .g-box.g-flex').first();

        await expect(container).toBeVisible();

        // Wait for all disks to render
        const vDisks = container.locator('.storage-disk-progress-bar');
        await expect(vDisks.first()).toBeVisible();

        // Verify donor stacks are present
        const stackedVDisks = container.locator('.ydb-stack');
        await expect(stackedVDisks.first()).toBeVisible();

        // Take screenshot of all disks in second group
        await expect(container).toHaveScreenshot('vdisk-state-mode-group2-replicating.png');
    });
});

test.describe('VDisk Coloring - Space Mode', () => {
    test.beforeEach(async ({page}) => {
        await enableExpertMode(page);
        await enableVDisksWithPdisksColumn(page);
        await setInitialVDisksGroupBy(page, 'Space');
        await setupSpaceModeMocks(page);
    });

    test.only('renders all capacity alert levels correctly', async ({page}) => {
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        await expect(container).toBeVisible();

        const vDisks = getAllVDisks(container);
        await expect(vDisks).toHaveCount(9);

        // Wait for all disks to be visible
        await expect(vDisks.first()).toBeVisible();
    });

    test('VDisk GREEN capacity - positive-light with G label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(0);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spacegreen/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for G label
        await expect(vDisk).toContainText('G');

        await expect(vDisk).toHaveScreenshot('vdisk-space-green.png');
    });

    test('VDisk CYAN capacity - cyan-bg with C label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(1);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spacecyan/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for C label
        await expect(vDisk).toContainText('C');

        await expect(vDisk).toHaveScreenshot('vdisk-space-cyan.png');
    });

    test('VDisk LIGHT_YELLOW capacity - ly-bg with LY label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(2);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spacelightyellow/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for LY label
        await expect(vDisk).toContainText('LY');

        await expect(vDisk).toHaveScreenshot('vdisk-space-light-yellow.png');
    });

    test('VDisk YELLOW capacity - warning-light with Y label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(3);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spaceyellow/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for Y label
        await expect(vDisk).toContainText('Y');

        await expect(vDisk).toHaveScreenshot('vdisk-space-yellow.png');
    });

    test('VDisk LIGHT_ORANGE capacity - lo-bg with LO label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(4);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spacelightorange/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for LO label
        await expect(vDisk).toContainText('LO');

        await expect(vDisk).toHaveScreenshot('vdisk-space-light-orange.png');
    });

    test('VDisk PRE_ORANGE capacity - po-bg with PO label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(5);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spacepre-orange/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for PO label
        await expect(vDisk).toContainText('PO');

        await expect(vDisk).toHaveScreenshot('vdisk-space-pre-orange.png');
    });

    test('VDisk ORANGE capacity - orange-bg with O label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(6);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spaceorange/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for O label
        await expect(vDisk).toContainText('O');

        await expect(vDisk).toHaveScreenshot('vdisk-space-orange.png');
    });

    test('VDisk RED capacity - danger-light with R label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(7);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spacered/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for R label
        await expect(vDisk).toContainText('R');

        await expect(vDisk).toHaveScreenshot('vdisk-space-red.png');
    });

    test('VDisk BLACK capacity - theme-dependent with B label', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const vDisk = getAllVDisks(container).nth(8);

        await expect(vDisk).toBeVisible();
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_spaceblack/);
        await expect(vDisk).toHaveClass(/storage-disk-progress-bar_mode-space/);

        // Check for B label
        await expect(vDisk).toContainText('B');

        await expect(vDisk).toHaveScreenshot('vdisk-space-black.png');
    });

    test('Space mode - all capacity alerts overview', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        await expect(container).toBeVisible();

        // Wait for all disks to render
        const vDisks = getAllVDisks(container);
        await expect(vDisks).toHaveCount(9);
        await expect(vDisks.first()).toBeVisible();

        await expect(container).toHaveScreenshot('vdisk-space-mode-all-capacity-alerts.png');
    });

    test('Space mode - labels visible without hover (compact mode)', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const greenVDisk = getAllVDisks(container).nth(0);

        await expect(greenVDisk).toBeVisible();

        // Labels should be visible in compact mode without hover
        await expect(greenVDisk).toContainText('G');

        await expect(greenVDisk).toHaveScreenshot('vdisk-space-green-label-visible.png');
    });

    test('Space mode - labels visible on hover (non-compact mode)', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const yellowVDisk = getAllVDisks(container).nth(3);

        await expect(yellowVDisk).toBeVisible();

        // Hover to activate label display
        await yellowVDisk.hover();

        // Label should be visible after hover
        await expect(yellowVDisk).toContainText('Y');

        await expect(yellowVDisk).toHaveScreenshot('vdisk-space-yellow-label-on-hover.png');
    });

    test('Space mode - BLACK label visible in both themes', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const blackVDisk = getAllVDisks(container).nth(8);

        await expect(blackVDisk).toBeVisible();

        // BLACK label should always be visible due to critical state
        await expect(blackVDisk).toContainText('B');

        await expect(blackVDisk).toHaveScreenshot('vdisk-space-black-label-visible.png');
    });
});

test.describe('VDisk Coloring - Space Mode with Replication', () => {
    test.beforeEach(async ({page}) => {
        await enableExpertMode(page);
        await enableVDisksWithPdisksColumn(page);
        await setInitialVDisksGroupBy(page, 'Space');
        await setupSpaceWithReplicationMocks(page);
    });

    test('Space mode - replicated vs striped comparison', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        await expect(container).toBeVisible();

        const vDisks = getAllVDisks(container);
        await expect(vDisks).toHaveCount(8);

        await expect(container).toHaveScreenshot('vdisk-space-mode-replication-variants.png');
    });

    test('GREEN replicated vs not replicated', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);

        // GREEN replicated
        const greenReplicated = getAllVDisks(container).nth(0);
        await expect(greenReplicated).toBeVisible();
        await expect(greenReplicated).not.toHaveClass(/storage-disk-progress-bar_striped/);
        await expect(greenReplicated).toHaveScreenshot('vdisk-space-green-replicated.png');

        // GREEN not replicated (striped)
        const greenStriped = getAllVDisks(container).nth(1);
        await expect(greenStriped).toBeVisible();
        await expect(greenStriped).toHaveClass(/storage-disk-progress-bar_striped/);
        await expect(greenStriped).toHaveScreenshot('vdisk-space-green-striped.png');
    });

    test('BLACK replicated vs not replicated - special pattern', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);

        // BLACK replicated
        const blackReplicated = getAllVDisks(container).nth(6);
        await expect(blackReplicated).toBeVisible();
        await expect(blackReplicated).not.toHaveClass(/storage-disk-progress-bar_striped/);
        await expect(blackReplicated).toHaveScreenshot('vdisk-space-black-replicated.png');

        // BLACK not replicated (special striped pattern)
        const blackStriped = getAllVDisks(container).nth(7);
        await expect(blackStriped).toBeVisible();
        await expect(blackStriped).toHaveClass(/storage-disk-progress-bar_striped/);
        await expect(blackStriped).toHaveScreenshot('vdisk-space-black-striped.png');
    });
});

test.describe('VDisk Coloring - Dark Theme', () => {
    test.beforeEach(async ({page}) => {
        await enableExpertMode(page);
        await enableVDisksWithPdisksColumn(page);

        // Enable dark theme
        await page.addInitScript(() => {
            localStorage.setItem('theme', JSON.stringify('dark'));
        });
    });

    test('State mode - dark theme', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await setupStateModeMocks(page);
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'State');

        const container = getVDisksContainer(page);
        await expect(container).toBeVisible();

        await expect(container).toHaveScreenshot('vdisk-state-mode-dark-theme.png');
    });

    test('Space mode - dark theme', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await setInitialVDisksGroupBy(page, 'Space');
        await setupSpaceModeMocks(page);
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        await expect(container).toBeVisible();

        await expect(container).toHaveScreenshot('vdisk-space-mode-dark-theme.png');
    });

    test('BLACK capacity in dark theme - special rendering', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await setInitialVDisksGroupBy(page, 'Space');
        await setupSpaceModeMocks(page);
        await gotoStoragePage(page);
        await setVDisksGroupBy(page, 'Space');

        const container = getVDisksContainer(page);
        const blackVDisk = getAllVDisks(container).nth(8);

        await expect(blackVDisk).toBeVisible();
        await expect(blackVDisk).toHaveScreenshot('vdisk-space-black-dark-theme.png');
    });
});
