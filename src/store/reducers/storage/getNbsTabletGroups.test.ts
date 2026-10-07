import type {NbsDisk} from '../../../types/api/nbs';

import {getTabletGroups, prepareTabletGroups} from './getNbsTabletGroups';
const id = (node: number) => ({NodeId: node, PDiskId: node === 0 ? 0 : 1, DDiskSlotId: 1010});
const disk = (node: number, available: boolean): NbsDisk => ({
    DiskId: id(node),
    Available: available,
});
test('degradation matches CMS and skips unallocated slots and unknown samples', () => {
    const groups = [
        {DirectBlockGroupId: 0, DDiskId: [id(1)], PersistentBufferDDiskId: [id(2)]},
        {
            DirectBlockGroupId: 1,
            DDiskId: [id(1), id(3), id(0)],
            PersistentBufferDDiskId: [id(2), id(4)],
        },
        {DirectBlockGroupId: 2, DDiskId: [id(5), {} as NbsDisk['DiskId']]},
    ];
    expect(
        prepareTabletGroups(groups, [
            disk(1, false),
            disk(2, false),
            disk(3, false),
            disk(4, true),
        ]).map((g) => g.Degrade),
    ).toEqual([1, 2, 0]);
});
test('collects all disk pages for the selected tablet and preserves cancellation', async () => {
    const signal = new AbortController().signal;
    const getNbsTablet = jest
        .fn()
        .mockResolvedValue({Status: 'OK', Groups: [{DirectBlockGroupId: 0, DDiskId: [id(2)]}]});
    const getNbsStorage = jest
        .fn()
        .mockResolvedValueOnce({Status: {Code: 'OK'}, TotalCount: 2, Disks: [disk(1, true)]})
        .mockResolvedValueOnce({Status: {Code: 'OK'}, TotalCount: 2, Disks: [disk(2, false)]});
    const oldApi = window.api;
    window.api = {storage: {getNbsTablet, getNbsStorage}} as unknown as typeof window.api;
    try {
        const result = await getTabletGroups('18446744073709551615', signal);
        expect(result.groups[0].Degrade).toBe(1);
        expect(getNbsTablet).toHaveBeenCalledWith('18446744073709551615', {signal});
        expect(getNbsStorage).toHaveBeenNthCalledWith(
            2,
            'disks',
            {
                filter_tablet_id: '18446744073709551615',
                include_tablet_ids: false,
                offset: 1,
                limit: 100,
            },
            {signal},
        );
    } finally {
        window.api = oldApi;
    }
});
