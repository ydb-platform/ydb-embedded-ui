import type {TPDiskStateInfo} from '../../../types/api/pdisk';
import type {TVDiskStateInfo, TVSlotId} from '../../../types/api/vdisk';
import {
    preparePDiskSizeFields,
    prepareVDiskSizeFields,
    prepareWhiteboardPDiskData,
    prepareWhiteboardVDiskData,
} from '../prepareDisks';

describe('prepareWhiteboardVDiskData', () => {
    test('Should correctly parse data', () => {
        const data = {
            VDiskId: {
                GroupID: 0,
                GroupGeneration: 1,
                Ring: 0,
                Domain: 0,
                VDisk: 0,
            },
            ChangeTime: '1730384311105',
            PDiskId: 1,
            VDiskSlotId: 0,
            Guid: '3910585916831022250',
            Kind: '0',
            NodeId: 1,
            VDiskState: 'OK',
            DiskSpace: 'Green',
            SatisfactionRank: {
                FreshRank: {
                    Flag: 'Green',
                },
                LevelRank: {
                    Flag: 'Green',
                },
            },
            Replicated: true,
            ReplicationProgress: 1,
            ReplicationSecondsRemaining: 0,
            AllocatedSize: '8996782080',
            AvailableSize: '188523479040',
            HasUnreadableBlobs: false,
            IncarnationGuid: '719472956608975753',
            InstanceGuid: '11219959563151194061',
            FrontQueues: 'Green',
            StoragePoolName: 'static',
            ReadThroughput: '0',
            WriteThroughput: '447',
        } as const as TVDiskStateInfo;

        const expectedResult = {
            StringifiedId: '0-1-0-0-0',
            VDiskId: {
                GroupID: 0,
                GroupGeneration: 1,
                Ring: 0,
                Domain: 0,
                VDisk: 0,
            },
            NodeId: 1,
            PDiskId: 1,
            VDiskSlotId: 0,
            StoragePoolName: 'static',

            ChangeTime: '1730384311105',

            Guid: '3910585916831022250',
            Kind: '0',
            IncarnationGuid: '719472956608975753',
            InstanceGuid: '11219959563151194061',

            Severity: 1,
            VDiskState: 'OK',
            DiskSpace: 'Green',
            FrontQueues: 'Green',
            SatisfactionRank: {
                FreshRank: {
                    Flag: 'Green',
                },
                LevelRank: {
                    Flag: 'Green',
                },
            },
            Replicated: true,
            ReplicationProgress: 1,
            ReplicationSecondsRemaining: 0,
            HasUnreadableBlobs: false,

            ReadThroughput: '0',
            WriteThroughput: '447',

            AvailableSize: 188523479040,
            AllocatedSize: 8996782080,
            TotalSize: 197520261120,
            AllocatedPercent: 4,
        };

        const preparedData = prepareWhiteboardVDiskData(data);

        expect(preparedData).toEqual(expectedResult);
    });
    test('Should parse unavailable donors', () => {
        const data = {
            NodeId: 1,
            PDiskId: 2,
            VSlotId: 3,
        } as const as TVSlotId;

        const expectedResult = {
            NodeId: 1,
            PDiskId: 2,
            VDiskSlotId: 3,
            StringifiedId: '1-2-3',
        };

        const preparedData = prepareWhiteboardVDiskData(data);

        expect(preparedData).toEqual(expectedResult);
    });
});

describe('prepareWhiteboardPDiskData', () => {
    test('Should correctly parse data', () => {
        const data = {
            PDiskId: 1,
            ChangeTime: '1730383540716',
            Path: '/dev/disk/by-partlabel/kikimr_nvme_01',
            Guid: '3910585916831022250',
            Category: '1',
            AvailableSize: '3107979264000',
            TotalSize: '3199556648960',
            State: 'Normal',
            NodeId: 1,
            Device: 'Green',
            Realtime: 'Green',
            SerialNumber: '',
            SystemSize: '817889280',
            LogUsedSize: '1772093440',
            LogTotalSize: '36805017600',
            ExpectedSlotCount: 16,
            EnforcedDynamicSlotSize: '197520261120',
            NumActiveSlots: 10,
        } as const as TPDiskStateInfo;

        const expectedResult = {
            PDiskId: 1,
            NodeId: 1,
            StringifiedId: '1-1',

            Type: 'SSD',
            Category: '1',
            Path: '/dev/disk/by-partlabel/kikimr_nvme_01',
            Guid: '3910585916831022250',
            SerialNumber: '',

            ChangeTime: '1730383540716',

            Severity: 1,
            Device: 'Green',
            Realtime: 'Green',
            State: 'Normal',

            AvailableSize: 3107979264000,
            TotalSize: 3199556648960,
            AllocatedSize: 91577384960,
            AllocatedPercent: 2,

            ExpectedSlotCount: 16,
            NumActiveSlots: 10,
            SlotSize: '197520261120',

            SystemSize: '817889280',
            LogUsedSize: '1772093440',
            LogTotalSize: '36805017600',
        };

        const preparedData = prepareWhiteboardPDiskData(data);

        expect(preparedData).toEqual(expectedResult);
    });
});

describe('prepareVDiskSizeFields', () => {
    test('Should prepare VDisk size fields', () => {
        expect(
            prepareVDiskSizeFields({
                AvailableSize: '400',
                AllocatedSize: '100',
            }),
        ).toEqual({
            AvailableSize: 400,
            AllocatedSize: 100,
            TotalSize: 500,
            AllocatedPercent: 20,
        });
    });
    test('Returns NaN if on undefined data', () => {
        expect(
            prepareVDiskSizeFields({
                AvailableSize: undefined,
                AllocatedSize: undefined,
            }),
        ).toEqual({
            AvailableSize: NaN,
            AllocatedSize: NaN,
            TotalSize: NaN,
            AllocatedPercent: NaN,
        });
    });
});

describe('preparePDiskSizeFields', () => {
    test('Should prepare PDisk size fields', () => {
        expect(
            preparePDiskSizeFields({
                AvailableSize: '400',
                TotalSize: '500',
            }),
        ).toEqual({
            AvailableSize: 400,
            AllocatedSize: 100,
            TotalSize: 500,
            AllocatedPercent: 20,
        });
    });
    test('Returns NaN if on undefined data', () => {
        expect(
            preparePDiskSizeFields({
                AvailableSize: undefined,
                TotalSize: undefined,
            }),
        ).toEqual({
            AvailableSize: NaN,
            AllocatedSize: NaN,
            TotalSize: NaN,
            AllocatedPercent: NaN,
        });
    });
});
