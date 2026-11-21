import type {NbsTabletResponse} from '../../../types/api/nbs';

import {getTabletGroups} from './getNbsTabletGroups';

const id = (node: number) => ({NodeId: node, PDiskId: 1, DDiskSlotId: 1010});

test.each([
    {requiredReadyMembers: 2, quorum: ['Quorum', 'Unknown', 'NoQuorum', 'Quorum']},
    {requiredReadyMembers: undefined, quorum: ['NoQuorum', 'NoQuorum', 'NoQuorum', 'Quorum']},
])(
    'derives independent role health from the detail snapshot with threshold $requiredReadyMembers',
    async ({requiredReadyMembers, quorum}) => {
        const signal = new AbortController().signal;
        const snapshot: NbsTabletResponse = {
            Status: 'OK',
            RequiredReadyMembers: requiredReadyMembers,
            Groups: [
                {
                    DirectBlockGroupId: 0,
                    NumVChunksClaimed: 2,
                    DDiskId: [id(1), {}, id(2)],
                    PersistentBufferDDiskId: [id(1), id(4)],
                },
                {
                    DirectBlockGroupId: 1,
                    DDiskId: [id(1), id(4)],
                    PersistentBufferDDiskId: [id(2), id(3), id(4)],
                },
                {
                    DirectBlockGroupId: 2,
                    DDiskId: [id(2), id(5)],
                    PersistentBufferDDiskId: [id(1), id(5)],
                },
                {
                    DirectBlockGroupId: 3,
                    DDiskId: [id(1), id(6), id(7)],
                    PersistentBufferDDiskId: [id(1), id(6), id(7)],
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
                {...id(5), DDiskStatus: 'Initializing', PersistentBufferStatus: 'Stopping'},
                {...id(6), DDiskStatus: 'Ready', PersistentBufferStatus: 'Ready'},
                {...id(7), DDiskStatus: 'Ready', PersistentBufferStatus: 'Ready'},
            ],
        };
        if (requiredReadyMembers === undefined) {
            snapshot.Groups?.forEach((group) => {
                group.MonitoredQuorum = 'NoQuorum';
            });
        }
        const getNbsTablet = jest.fn().mockResolvedValue(snapshot);
        const getNbsStorage = jest.fn();
        const oldApi = window.api;
        window.api = {storage: {getNbsTablet, getNbsStorage}} as unknown as typeof window.api;
        try {
            const result = await getTabletGroups('18446744073709551615', signal);
            expect(result.groups.map((group) => group.quorum)).toEqual(quorum);
            expect(result.groups[0]).toMatchObject({
                DirectBlockGroupId: 0,
                NumVChunksClaimed: 2,
                disks: {ids: [id(1), id(2)], ready: 2, unavailable: 0, unknown: 0},
                buffers: {ready: 2, unavailable: 0, unknown: 0},
            });
            expect(result.groups[1]).toMatchObject({
                disks: {ready: 1, unavailable: 0, unknown: 1},
                buffers: {ready: 1, unavailable: 1, unknown: 1},
            });
            expect(result.groups[2]).toMatchObject({
                disks: {ready: 1, unavailable: 1, unknown: 0},
                buffers: {ready: 1, unavailable: 1, unknown: 0},
            });
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
    },
);
