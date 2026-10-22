import {expect, test} from '@playwright/test';

import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../../../src/containers/Storage/shared';
import {ClusterStorageTable} from '../paginatedTable/paginatedTable';
import {setupTabletDevUiMocks} from '../tablet/tabletDevUiMocks';

import {VDiskPage} from './VDiskPage';
import {
    DONOR_VDISK_ID,
    GROUP_ID,
    NODE_ID,
    VDISK_ID,
    VDISK_PAGE_PATH,
    setupPDiskInfoMock,
    setupVDiskPageMocks,
} from './vdiskPageMocks';

for (const scenario of [
    {name: 'legacy disabled', flag: false, diskApi: false, path: '/tablets/app'},
    {name: 'legacy enabled', flag: true, diskApi: false, path: '/tablets/app/secure'},
    {name: 'new disk API', flag: true, diskApi: true, path: '/vdisk/evict'},
]) {
    test(`VDisk eviction uses ${scenario.name} through the confirmation dialog`, async ({
        page,
        baseURL,
    }) => {
        await setupVDiskPageMocks(page);
        const mock = await setupTabletDevUiMocks(page, scenario, baseURL);
        const vdisk = new VDiskPage(page);
        await vdisk.goto();
        await vdisk.evict.click();
        await expect(vdisk.dialog).toBeVisible();
        await expect(
            vdisk.dialog.getByText('The VDisk will be evicted from the PDisk.', {exact: true}),
        ).toBeVisible();
        await expect(vdisk.dialog.locator('.g-alert.g-card_theme_warning')).toHaveText(
            'This VDisk will be replaced by a new one in the group. Data will be replicated to the new disk. The old VDisk will serve as a donor until replication is complete, and then it will be removed.',
        );
        expect(mock.requests.filter(({method}) => method === 'POST')).toHaveLength(0);
        await vdisk.confirmEvict.click();
        await expect(vdisk.dialog).toBeHidden();

        const mutations = mock.requests.filter(({method}) => method === 'POST');
        expect(mutations).toHaveLength(1);
        const request = mutations[0];
        const url = new URL(request.url);
        expect(url.pathname).toBe(scenario.path);
        if (scenario.diskApi) {
            expect(Object.fromEntries(url.searchParams)).toMatchObject({
                group_id: GROUP_ID,
                group_generation_id: '1',
                fail_realm_idx: '0',
                fail_domain_idx: '0',
                vdisk_idx: '0',
            });
            expect(url.searchParams.has('force')).toBe(false);
        } else {
            expect(url.searchParams.get('TabletID')).toBe('72057594037932033');
            expect(url.searchParams.get('exec')).toBe('1');
            expect(request.accept).toBe('application/json');
            expect(request.body).toEqual({
                Command: {
                    ReassignGroupDisk: {
                        GroupId: Number(GROUP_ID),
                        GroupGeneration: 1,
                        FailRealmIdx: 0,
                        FailDomainIdx: 0,
                        VDiskIdx: 0,
                    },
                },
            });
        }
    });
}

test('VDisk eviction keeps donor and permission restrictions', async ({page, baseURL}) => {
    await setupVDiskPageMocks(page, {withDonors: true});
    const options = {flag: true, monitoring: true};
    const mock = await setupTabletDevUiMocks(page, options, baseURL);
    const donor = new VDiskPage(page, VDISK_PAGE_PATH.replace(VDISK_ID, DONOR_VDISK_ID));
    await donor.goto();
    await expect(page.getByTestId('vdisk-header').getByText('Donor', {exact: true})).toBeVisible();
    await expect(
        page.getByTestId('vdisk-page-info').getByRole('link', {
            name: `VDisk ${VDISK_ID} on node ${NODE_ID}`,
            exact: true,
        }),
    ).toBeVisible();
    await expect(donor.evict).toHaveCount(0);

    options.monitoring = false;
    const vdisk = new VDiskPage(page);
    await vdisk.goto();
    await expect(vdisk.evict).toBeDisabled();
    expect(mock.requests.filter(({method}) => method === 'POST')).toHaveLength(0);
});

test('VDisk eviction preserves its error and explicit force retry', async ({page}) => {
    await setupVDiskPageMocks(page);
    const requests: URL[] = [];
    await page.route('**/vdisk/evict*', async (route) => {
        const url = new URL(route.request().url());
        requests.push(url);
        await route.fulfill({
            json:
                url.searchParams.get('force') === 'true'
                    ? {result: true}
                    : {
                          result: false,
                          error: 'Synthetic retryable failure',
                          forceRetryPossible: true,
                      },
        });
    });
    const vdisk = new VDiskPage(page);
    await vdisk.goto();
    await vdisk.evict.click();
    await vdisk.confirmEvict.click();
    await expect(
        vdisk.dialog.getByText('Synthetic retryable failure', {exact: true}),
    ).toBeVisible();
    await expect(
        vdisk.dialog.getByText('The VDisk will be evicted from the PDisk.', {exact: true}),
    ).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.has('force')).toBe(false);
    await vdisk.dialog.getByRole('button', {name: 'Evict anyway', exact: true}).click();
    await expect(vdisk.dialog).toBeHidden();
    expect(requests).toHaveLength(2);
    expect(requests[1].searchParams.get('force')).toBe('true');
    expect(requests[1].searchParams.get('group_id')).toBe(GROUP_ID);
});

test('VDisk eviction confirmation closes when its page unmounts without submitting', async ({
    page,
}) => {
    await setupVDiskPageMocks(page);
    let evictRequests = 0;
    await page.route('**/vdisk/evict*', async (route) => {
        evictRequests++;
        await route.fulfill({json: {result: true}});
    });
    const vdisk = new VDiskPage(page);
    await vdisk.goto();
    await setupPDiskInfoMock(page);
    await page
        .locator('.ydb-vdisk-storage-details')
        .getByRole('link', {name: 'Go to PDisk'})
        .click();
    await expect(page).toHaveURL(/\/pDisk\?/);
    await page.goBack();
    await vdisk.evict.click();
    await expect(vdisk.dialog).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/pDisk\?/);
    await expect(vdisk.dialog).toBeHidden();
    expect(evictRequests).toBe(0);
});

for (const source of ['page', 'popup']) {
    test(`VDisk eviction from ${source} refreshes data after dismissal without closing a new dialog`, async ({
        page,
    }) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await setupVDiskPageMocks(page);
        const pendingResponse = Promise.withResolvers<void>();
        let evictRequests = 0;
        await page.route('**/vdisk/evict*', async (route) => {
            evictRequests++;
            expect(new URL(route.request().url()).searchParams.get('group_id')).toBe(GROUP_ID);
            await pendingResponse.promise;
            await route.fulfill({json: {result: true}});
        });
        const vdisk = new VDiskPage(page);
        const disk = page
            .locator(
                `.ydb-storage-vdisks__wrapper [data-disk-id="${VDISK_ID}"] .storage-disk-progress-bar`,
            )
            .first();
        const popup = page.locator('.vdisk-storage-popup').filter({hasText: VDISK_ID}).last();
        const popupEvict = popup.getByRole('button', {name: 'Evict VDisk', exact: true});

        try {
            await vdisk.goto();
            await new ClusterStorageTable(page).waitForTableData();
            if (source === 'popup') {
                await disk.hover();
            }
            await (source === 'page' ? vdisk.evict : popupEvict).click();
            await vdisk.confirmEvict.click();
            await expect.poll(() => evictRequests).toBe(1);
            await page.mouse.move(0, 0);
            await page.keyboard.press('Escape');
            await expect(vdisk.dialog).toHaveCount(0);
            await expect(popup).toHaveCount(0);

            // Reopen the card and confirmation while the first eviction is still pending.
            await disk.hover();
            await popupEvict.click();
            await expect(vdisk.dialog).toBeVisible();
            await expect(popup).toBeVisible();
            const refreshed = page.waitForResponse(
                (response) => response.url().includes('/storage/groups?') && response.ok(),
            );
            pendingResponse.resolve();
            await refreshed;
            await page.waitForTimeout(DISKS_POPUP_DEBOUNCE_TIMEOUT * 2);
            await expect(vdisk.dialog).toBeVisible();
            await expect(popup).toBeVisible();
            expect(evictRequests).toBe(1);
            await page.keyboard.press('Escape');
            await expect(vdisk.dialog).toBeHidden();
        } finally {
            pendingResponse.resolve();
        }
    });
}
