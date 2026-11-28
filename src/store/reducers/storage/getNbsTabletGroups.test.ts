import type {NbsTabletResponse} from '../../../types/api/nbs';

import {getTabletGroups} from './getNbsTabletGroups';

const id = (node: number) => ({NodeId: node, PDiskId: 1, DDiskSlotId: 1010});

test('uses a strict majority of allocated members for each role', async () => {
    const signal = new AbortController().signal;
    const snapshot: NbsTabletResponse = {
        Status: 'OK',
        Groups: [
            {
                DirectBlockGroupId: 0,
                NumVChunksClaimed: 2,
                DDiskId: [{}, {}, id(2)],
                PersistentBufferDDiskId: [id(1), id(2), id(4), id(6)],
            },
            {
                DirectBlockGroupId: 1,
                DDiskId: [id(1), id(5), id(4)],
                PersistentBufferDDiskId: [id(1), id(4), id(6)],
            },
            {
                DirectBlockGroupId: 2,
                DDiskId: [id(1), id(2), id(5), id(7)],
                PersistentBufferDDiskId: [id(1), id(4), id(6)],
            },
            {
                DirectBlockGroupId: 3,
                DDiskId: [id(3), id(4)],
                PersistentBufferDDiskId: [id(1)],
            },
            {
                DirectBlockGroupId: 4,
                DDiskId: [{}, {}],
                PersistentBufferDDiskId: [id(1)],
            },
        ],
        Slots: [
            {...id(1), DDiskStatus: 'Ready', PersistentBufferStatus: 'Ready'},
            {
                ...id(2),
                DDiskStatus: 'Ready',
                PersistentBufferStatus: 'Broken',
                PersistentBufferStatusReason: 'I/O error',
                AllocatedSize: '1000',
                PersistentBufferId: '[2:5893148750:1010]',
            },
            {...id(4), PersistentBufferStatus: 'Ready'},
            {...id(5), DDiskStatus: 'Initializing'},
            {...id(6), PersistentBufferStatus: 'Ready'},
            {...id(7), DDiskStatus: 'Stopping'},
        ],
    };
    const getNbsTablet = jest.fn().mockResolvedValue(snapshot);
    const getNbsStorage = jest.fn();
    const oldApi = window.api;
    window.api = {storage: {getNbsTablet, getNbsStorage}} as unknown as typeof window.api;
    try {
        const result = await getTabletGroups('18446744073709551615', signal);
        expect(result.groups.map((group) => group.quorum)).toEqual([
            'Quorum',
            'Unknown',
            'NoQuorum',
            'Unknown',
            'NoQuorum',
        ]);
        expect(result.groups[0]).toMatchObject({
            DirectBlockGroupId: 0,
            NumVChunksClaimed: 2,
            disks: {ids: [id(2)], ready: 1, unavailable: 0, unknown: 0},
            buffers: {ready: 3, unavailable: 1, unknown: 0},
        });
        expect(result.groups[1].disks).toMatchObject({ready: 1, unavailable: 1, unknown: 1});
        expect(result.groups[2].disks).toMatchObject({ready: 2, unavailable: 2, unknown: 0});
        expect(result.groups[3].disks).toMatchObject({ready: 0, unavailable: 0, unknown: 2});
        expect(result.slots['2:1:1010']).toMatchObject({
            DDiskStatus: 'Ready',
            PersistentBufferStatus: 'Broken',
            PersistentBufferStatusReason: 'I/O error',
            AllocatedSize: '1000',
            PersistentBufferId: '[2:5893148750:1010]',
        });
        expect(getNbsTablet).toHaveBeenCalledWith('18446744073709551615', {signal});
        expect(getNbsStorage).not.toHaveBeenCalled();
    } finally {
        window.api = oldApi;
    }
});
