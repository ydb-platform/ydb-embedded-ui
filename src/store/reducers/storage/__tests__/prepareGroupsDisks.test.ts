import type {TStoragePDisk, TStorageVDisk} from '../../../../types/api/storage';
import {prepareGroupsPDisk, prepareGroupsVDisk} from '../prepareGroupsDisks';

describe('prepareGroupsVDisk', () => {
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
            TotalSize: 265405071360,
            AllocatedPercent: 11,

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
            TotalSize: 265405071360,
            AllocatedPercent: 11,

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
            TotalSize: 265405071360,
            AllocatedPercent: 11,

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
