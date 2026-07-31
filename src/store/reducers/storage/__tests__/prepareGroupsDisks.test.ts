import {ECapacityAlert} from '../../../../types/api/enums';
import type {TPDiskStateInfo} from '../../../../types/api/pdisk';
import type {TStoragePDisk, TStorageVDisk} from '../../../../types/api/storage';
import type {TVDiskStateInfo} from '../../../../types/api/vdisk';
import {prepareGroupsPDisk, prepareGroupsVDisk} from '../prepareGroupsDisks';

const vDiskWithCapacityMetrics = {
    VDiskId: {
        GroupID: 0,
        GroupGeneration: 0,
        Ring: 0,
        Domain: 0,
        VDisk: 0,
    },
    GroupSizeInUnits: 0,
    VDiskSlotUsage: 82.25,
    VDiskRawUsage: 64.5,
    NormalizedOccupancy: 1.12,
    CapacityAlert: ECapacityAlert.LIGHTYELLOW,
} satisfies TVDiskStateInfo;

const pDiskWithCapacityMetrics = {
    SlotSizeInUnits: 0,
    PDiskUsage: 70.5,
    PDiskCapacityAlert: ECapacityAlert.ORANGE,
} satisfies TPDiskStateInfo;

describe('prepareGroupsVDisk', () => {
    test('Should preserve nested Whiteboard capacity metrics including zero values', () => {
        const preparedData = prepareGroupsVDisk({
            Whiteboard: vDiskWithCapacityMetrics,
            PDisk: {Whiteboard: pDiskWithCapacityMetrics},
        });

        expect(preparedData).toEqual(expect.objectContaining(vDiskWithCapacityMetrics));
        expect(preparedData.PDisk).toEqual(expect.objectContaining(pDiskWithCapacityMetrics));
    });

    test('Should omit absent nested Whiteboard capacity metrics', () => {
        const preparedData = prepareGroupsVDisk({Whiteboard: {}, PDisk: {Whiteboard: {}}});

        expect(preparedData).not.toHaveProperty('VDiskSlotUsage');
        expect(preparedData.PDisk).not.toHaveProperty('PDiskUsage');
    });

    test('Should preserve the BSC size and prepare a separate Whiteboard size', () => {
        const preparedData = prepareGroupsVDisk({
            AllocatedSize: '1000000000',
            AvailableSize: '3000000000',
            Whiteboard: {
                AllocatedSize: '1000000000',
                AvailableSize: '21000000000',
            },
            PDisk: {
                Whiteboard: {
                    EnforcedDynamicSlotSize: '22000000000',
                },
            },
        });

        expect(preparedData).toEqual(
            expect.objectContaining({
                AllocatedSize: 1_000_000_000,
                SizeLimit: 4_000_000_000,
                WhiteboardSize: {
                    AllocatedSize: 1_000_000_000,
                    SizeLimit: 22_000_000_000,
                },
            }),
        );
    });

    test('Should keep the legacy size fallback for a donor without nested Whiteboard data', () => {
        const preparedData = prepareGroupsVDisk({
            Donors: [
                {
                    AllocatedSize: '1000000000',
                    AvailableSize: '3000000000',
                },
            ],
        });

        expect(preparedData.Donors?.[0]).toEqual(
            expect.objectContaining({
                AllocatedSize: 1_000_000_000,
                SizeLimit: 4_000_000_000,
                DonorMode: true,
            }),
        );
        expect(preparedData.Donors?.[0]).not.toHaveProperty('WhiteboardSize');
    });

    test('Should correctly parse data', () => {
        const vDiksDataWithoutPDisk = {
            VDiskId: '2181038134-22-0-0-0',
            NodeId: 224,
            AllocatedSize: '30943477760',
            AvailableSize: '234461593600',
            Status: 'READY',
            DiskSpace: 'Green',
            Whiteboard: {
                VDiskId: {
                    GroupID: 2181038134,
                    GroupGeneration: 22,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
                ChangeTime: '1730273487988',
                PDiskId: 1001,
                VDiskSlotId: 1019,
                Guid: '10619691988133943213',
                Kind: '0',
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
                UnsyncedVDisks: '3',
                AllocatedSize: '30943477760',
                AvailableSize: '234461593600',
                HasUnreadableBlobs: false,
                IncarnationGuid: '14709186654400312808',
                InstanceGuid: '18225898175839904663',
                FrontQueues: 'Green',
                StoragePoolName: '/storage/pool/name',
                ReadThroughput: '0',
                WriteThroughput: '0',
            },
        } as const as TStorageVDisk;

        const expectedResult = {
            VDiskId: {
                GroupID: 2181038134,
                GroupGeneration: 22,
                Ring: 0,
                Domain: 0,
                VDisk: 0,
            },
            StringifiedId: '2181038134-22-0-0-0',
            NodeId: 224,
            PDiskId: 1001,
            VDiskSlotId: 1019,

            StoragePoolName: '/storage/pool/name',

            Kind: '0',
            ChangeTime: '1730273487988',
            Guid: '10619691988133943213',
            IncarnationGuid: '14709186654400312808',
            InstanceGuid: '18225898175839904663',

            Severity: 1,
            VDiskState: 'OK',
            DiskSpace: 'Green',
            FrontQueues: 'Green',
            Status: 'READY',
            SatisfactionRank: {
                FreshRank: {
                    Flag: 'Green',
                },
                LevelRank: {
                    Flag: 'Green',
                },
            },
            Replicated: true,

            UnsyncedVDisks: '3',
            HasUnreadableBlobs: false,

            ReadThroughput: '0',
            WriteThroughput: '0',

            AllocatedSize: 30943477760,
            AvailableSize: 234461593600,
            SizeLimit: 265405071360,
            FreeSize: 234461593600,
            AllocatedPercent: 11,
            WhiteboardSize: {
                AllocatedSize: 30943477760,
                SizeLimit: 265405071360,
            },

            Donors: undefined,

            PDisk: {
                AllocatedPercent: NaN,
                AllocatedSize: NaN,
                AvailableSize: NaN,
                NodeId: 224,
                PDiskId: undefined,
                Severity: 0,
                SlotSize: undefined,
                StringifiedId: undefined,
                TotalSize: NaN,
                Type: undefined,
            },
        };

        const preparedData = prepareGroupsVDisk(vDiksDataWithoutPDisk);

        expect(preparedData).toEqual(expectedResult);
    });
    test('Should use BSC data when no Whiteboard data', () => {
        const vDiksDataWithoutPDisk = {
            VDiskId: '2181038134-22-0-0-0',
            NodeId: 224,
            AllocatedSize: '30943477760',
            AvailableSize: '234461593600',
            Status: 'READY',
            DiskSpace: 'Green',
        } as const as TStorageVDisk;

        const expectedResult = {
            StringifiedId: '2181038134-22-0-0-0',
            NodeId: 224,

            Severity: 0,
            DiskSpace: 'Green',
            Status: 'READY',

            AllocatedSize: 30943477760,
            AvailableSize: 234461593600,
            SizeLimit: 265405071360,
            FreeSize: 234461593600,
            AllocatedPercent: 11,

            Donors: undefined,
            PDiskId: undefined,
            VDiskId: undefined,

            PDisk: {
                AllocatedPercent: NaN,
                AllocatedSize: NaN,
                AvailableSize: NaN,
                NodeId: 224,
                PDiskId: undefined,
                Severity: 0,
                SlotSize: undefined,
                StringifiedId: undefined,
                TotalSize: NaN,
                Type: undefined,
            },
        };

        const preparedData = prepareGroupsVDisk(vDiksDataWithoutPDisk);

        expect(preparedData).toEqual(expectedResult);
    });
    test('Should use Whiteboard data when no BSC data', () => {
        const vDiksDataWithoutPDisk = {
            Whiteboard: {
                VDiskId: {
                    GroupID: 2181038134,
                    GroupGeneration: 22,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
                ChangeTime: '1730273487988',
                PDiskId: 1001,
                VDiskSlotId: 1019,
                Guid: '10619691988133943213',
                Kind: '0',
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
                UnsyncedVDisks: '3',
                AllocatedSize: '30943477760',
                AvailableSize: '234461593600',
                HasUnreadableBlobs: false,
                IncarnationGuid: '14709186654400312808',
                InstanceGuid: '18225898175839904663',
                FrontQueues: 'Green',
                StoragePoolName: '/storage/pool/name',
                ReadThroughput: '0',
                WriteThroughput: '0',
            },
        } as const as TStorageVDisk;

        const expectedResult = {
            VDiskId: {
                GroupID: 2181038134,
                GroupGeneration: 22,
                Ring: 0,
                Domain: 0,
                VDisk: 0,
            },
            StringifiedId: '2181038134-22-0-0-0',
            PDiskId: 1001,
            VDiskSlotId: 1019,

            StoragePoolName: '/storage/pool/name',

            Kind: '0',
            ChangeTime: '1730273487988',
            Guid: '10619691988133943213',
            IncarnationGuid: '14709186654400312808',
            InstanceGuid: '18225898175839904663',

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

            UnsyncedVDisks: '3',
            HasUnreadableBlobs: false,

            ReadThroughput: '0',
            WriteThroughput: '0',

            AllocatedSize: 30943477760,
            AvailableSize: 234461593600,
            SizeLimit: 265405071360,
            FreeSize: 234461593600,
            AllocatedPercent: 11,
            WhiteboardSize: {
                AllocatedSize: 30943477760,
                SizeLimit: 265405071360,
            },

            Donors: undefined,

            PDisk: {
                AllocatedPercent: NaN,
                AllocatedSize: NaN,
                AvailableSize: NaN,
                NodeId: undefined,
                PDiskId: undefined,
                Severity: 0,
                SlotSize: undefined,
                StringifiedId: undefined,
                TotalSize: NaN,
                Type: undefined,
            },
        };

        const preparedData = prepareGroupsVDisk(vDiksDataWithoutPDisk);

        expect(preparedData).toEqual(expectedResult);
    });

    test('Should derive FreeSize from PDisk slot size fallback when AvailableSize is 0', () => {
        const vDiskData = {
            VDiskId: '2181038134-22-0-0-0',
            NodeId: 224,
            AllocatedSize: '300',
            AvailableSize: '0',
            PDisk: {
                SlotSize: '500',
            },
        } as const as TStorageVDisk;

        const preparedData = prepareGroupsVDisk(vDiskData);

        expect(preparedData.SizeLimit).toBe(500);
        expect(preparedData.FreeSize).toBe(200);
        expect(preparedData.AllocatedPercent).toBe(60);
    });
});

describe('prepareGroupsPDisk', () => {
    test('Should correctly parse data', () => {
        const pDiskData = {
            PDiskId: '224-1001',
            NodeId: 224,
            Path: '/dev/disk/by-partlabel/kikimr_nvme_04',
            Type: 'ssd',
            Guid: '10619691988133943213',
            Category: '1',
            TotalSize: '6400161873920',
            AvailableSize: '5613855703040',
            Status: 'ACTIVE',
            DiskSpace: 'Green',
            DecommitStatus: 'DECOMMIT_NONE',
            SlotSize: '265405071360',
            Whiteboard: {
                PDiskId: 1001,
                ChangeTime: '1730273451793',
                Path: '/dev/disk/by-partlabel/kikimr_nvme_04',
                Guid: '10619691988133943213',
                Category: '1',
                AvailableSize: '5613855703040',
                TotalSize: '6400161873920',
                State: 'Normal',
                Device: 'Green',
                Realtime: 'Green',
                SerialNumber: 'PHLN227201336P4CGN',
                SystemSize: '817889280',
                LogUsedSize: '3271557120',
                LogTotalSize: '27262976000',
                ExpectedSlotCount: 24,
                EnforcedDynamicSlotSize: '265405071360',
                NumActiveSlots: 18,
            },
        } as const as TStoragePDisk & {
            NodeId?: number;
        };

        const expectedResult = {
            NodeId: 224,
            PDiskId: 1001,
            StringifiedId: '224-1001',

            ChangeTime: '1730273451793',
            Path: '/dev/disk/by-partlabel/kikimr_nvme_04',
            Guid: '10619691988133943213',
            SerialNumber: 'PHLN227201336P4CGN',

            Category: '1',
            Type: 'SSD',

            State: 'Normal',
            Device: 'Green',
            Realtime: 'Green',
            Status: 'ACTIVE',
            DiskSpace: 'Green',
            DecommitStatus: 'DECOMMIT_NONE',

            AvailableSize: 5613855703040,
            TotalSize: 6400161873920,
            AllocatedPercent: 12,
            AllocatedSize: 786306170880,
            Severity: 1,

            SystemSize: '817889280',
            LogUsedSize: '3271557120',
            LogTotalSize: '27262976000',

            NumActiveSlots: 18,
            ExpectedSlotCount: 24,
            SlotSize: '265405071360',
            EnforcedDynamicSlotSize: '265405071360',
        };

        const preparedData = prepareGroupsPDisk(pDiskData);

        expect(preparedData).toEqual(expectedResult);
    });
    test('Should use BSC data when no Whiteboard data', () => {
        const pDiskData = {
            PDiskId: '224-1001',
            NodeId: 224,
            Path: '/dev/disk/by-partlabel/kikimr_nvme_04',
            Type: 'ssd',
            Guid: '10619691988133943213',
            Category: '1',
            TotalSize: '6400161873920',
            AvailableSize: '5613855703040',
            Status: 'ACTIVE',
            DiskSpace: 'Green',
            DecommitStatus: 'DECOMMIT_NONE',
            SlotSize: '265405071360',
        } as const as TStoragePDisk & {
            NodeId?: number;
        };

        const expectedResult = {
            NodeId: 224,
            PDiskId: 1001,
            StringifiedId: '224-1001',

            Path: '/dev/disk/by-partlabel/kikimr_nvme_04',
            Guid: '10619691988133943213',

            Category: '1',
            Type: 'SSD',

            Severity: 0,

            Status: 'ACTIVE',
            DiskSpace: 'Green',
            DecommitStatus: 'DECOMMIT_NONE',

            TotalSize: 6400161873920,
            AvailableSize: 5613855703040,
            AllocatedPercent: 12,
            AllocatedSize: 786306170880,

            SlotSize: '265405071360',
        };

        const preparedData = prepareGroupsPDisk(pDiskData);

        expect(preparedData).toEqual(expectedResult);
    });
    test('Should use Whiteboard data when no BSC data', () => {
        const pDiskData = {
            NodeId: 224,
            Whiteboard: {
                PDiskId: 1001,
                ChangeTime: '1730273451793',
                Path: '/dev/disk/by-partlabel/kikimr_nvme_04',
                Guid: '10619691988133943213',
                Category: '1',
                AvailableSize: '5613855703040',
                TotalSize: '6400161873920',
                State: 'Normal',
                Device: 'Green',
                Realtime: 'Green',
                SerialNumber: 'PHLN227201336P4CGN',
                SystemSize: '817889280',
                LogUsedSize: '3271557120',
                LogTotalSize: '27262976000',
                ExpectedSlotCount: 24,
                EnforcedDynamicSlotSize: '265405071360',
                NumActiveSlots: 18,
            },
        } as const as TStoragePDisk & {
            NodeId?: number;
        };

        const expectedResult = {
            NodeId: 224,
            PDiskId: 1001,
            StringifiedId: '224-1001',

            ChangeTime: '1730273451793',
            Path: '/dev/disk/by-partlabel/kikimr_nvme_04',
            Guid: '10619691988133943213',
            SerialNumber: 'PHLN227201336P4CGN',

            Category: '1',
            Type: 'SSD',

            State: 'Normal',
            Device: 'Green',
            Realtime: 'Green',

            AvailableSize: 5613855703040,
            TotalSize: 6400161873920,
            AllocatedPercent: 12,
            AllocatedSize: 786306170880,
            Severity: 1,

            SystemSize: '817889280',
            LogUsedSize: '3271557120',
            LogTotalSize: '27262976000',

            NumActiveSlots: 18,
            ExpectedSlotCount: 24,
            SlotSize: '265405071360',
            EnforcedDynamicSlotSize: '265405071360',
        };

        const preparedData = prepareGroupsPDisk(pDiskData);

        expect(preparedData).toEqual(expectedResult);
    });
});
