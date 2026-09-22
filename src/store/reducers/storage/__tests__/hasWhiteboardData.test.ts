import {TPDiskState} from '../../../../types/api/pdisk';
import {EVDiskState} from '../../../../types/api/vdisk';
import {prepareWhiteboardPDiskData} from '../../../../utils/disks/prepareDisks';
import {prepareGroupsVDisk} from '../prepareGroupsDisks';
import {prepareStorageNodesResponse} from '../utils';

const whiteboardCases = [
    {marker: false, legacyData: true, expected: false},
    {marker: true, legacyData: false, expected: true},
    {marker: undefined, legacyData: true, expected: true},
    {marker: undefined, legacyData: false, expected: false},
];

describe('Whiteboard availability', () => {
    test.each(whiteboardCases)(
        'nodes prefer marker=$marker over legacy data=$legacyData',
        ({marker, legacyData, expected}) => {
            const {nodes} = prepareStorageNodesResponse({
                TotalNodes: '1',
                FoundNodes: '1',
                Nodes: [
                    {
                        NodeId: 1,
                        SystemState: {},
                        PDisks: [
                            {
                                PDiskId: 1,
                                HasWhiteboardData: marker,
                                State: legacyData ? TPDiskState.Normal : undefined,
                                AvailableSize: '300',
                                TotalSize: '400',
                            },
                        ],
                        VDisks: [
                            {
                                HasWhiteboardData: marker,
                                PDiskId: 1,
                                VDiskId: legacyData ? {GroupID: 1} : undefined,
                                VDiskState: legacyData ? EVDiskState.OK : undefined,
                                AllocatedSize: '100',
                                AvailableSize: '300',
                            },
                        ],
                    },
                ],
            });
            const pDisk = nodes?.[0].PDisks?.[0];
            const vDisk = nodes?.[0].VDisks?.[0];

            for (const disk of [pDisk, vDisk]) {
                expect(disk).toEqual(
                    expect.objectContaining({
                        HasWhiteboardData: expected,
                        AllocatedPercent: 25,
                        AllocatedSize: 100,
                    }),
                );
            }
            expect(pDisk?.WhiteboardSize).toEqual(
                expected ? {AllocatedSize: 100, TotalSize: 400} : undefined,
            );
            expect(vDisk?.WhiteboardSize).toEqual(
                expected ? {AllocatedSize: 100, SizeLimit: 400} : undefined,
            );
        },
    );

    test.each(whiteboardCases)(
        'groups prefer marker=$marker over nested Whiteboard=$legacyData',
        ({marker, legacyData, expected}) => {
            const vDisk = prepareGroupsVDisk({
                HasWhiteboardData: marker,
                AllocatedSize: '100',
                AvailableSize: '300',
                Whiteboard: legacyData ? {AllocatedSize: '100', AvailableSize: '900'} : undefined,
                PDisk: {
                    HasWhiteboardData: marker,
                    AvailableSize: '300',
                    TotalSize: '400',
                    Whiteboard: legacyData ? {AvailableSize: '900', TotalSize: '1000'} : undefined,
                },
            });

            for (const disk of [vDisk, vDisk.PDisk]) {
                expect(disk).toEqual(
                    expect.objectContaining({
                        HasWhiteboardData: expected,
                        AllocatedPercent: 25,
                        AllocatedSize: 100,
                    }),
                );
            }
            expect(vDisk.WhiteboardSize).toEqual(
                expected && legacyData ? {AllocatedSize: 100, SizeLimit: 1000} : undefined,
            );
            expect(vDisk.PDisk?.WhiteboardSize).toEqual(
                expected && legacyData
                    ? {AllocatedSize: 100, TotalSize: 1000, AllocatedPercent: 10}
                    : undefined,
            );
        },
    );

    test('preserves independent donor and PDisk markers and BSC statuses', () => {
        const vDisk = prepareGroupsVDisk({
            HasWhiteboardData: false,
            Donors: [
                {
                    HasWhiteboardData: true,
                    Whiteboard: {},
                    PDisk: {HasWhiteboardData: false, Status: 'FAULTY'},
                },
            ],
        });

        expect(vDisk.HasWhiteboardData).toBe(false);
        expect(vDisk.Donors?.[0]).toEqual(
            expect.objectContaining({
                HasWhiteboardData: true,
                DonorMode: true,
                PDisk: expect.objectContaining({HasWhiteboardData: false, DriveStatus: 'FAULTY'}),
            }),
        );
    });

    test('does not treat flat PDisk sizes as Whiteboard when the marker is false', () => {
        const pDisk = prepareWhiteboardPDiskData({
            HasWhiteboardData: false,
            State: TPDiskState.Normal,
            AvailableSize: '300',
            TotalSize: '400',
        });

        expect(pDisk).toEqual(
            expect.objectContaining({HasWhiteboardData: false, AllocatedPercent: 25}),
        );
        expect(pDisk.WhiteboardSize).toBeUndefined();
    });
});
