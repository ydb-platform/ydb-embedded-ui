import {expect, test} from '@playwright/test';

import {setupTabletDevUiMocks} from '../tablet/tabletDevUiMocks';

import {VDiskPage} from './VDiskPage';
import {
    DONOR_VDISK_ID,
    GROUP_ID,
    VDISK_ID,
    VDISK_PAGE_PATH,
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
    await expect(donor.evict).toBeDisabled();

    options.monitoring = false;
    const vdisk = new VDiskPage(page);
    await vdisk.goto();
    await expect(vdisk.evict).toBeDisabled();
    expect(mock.requests.filter(({method}) => method === 'POST')).toHaveLength(0);
});
