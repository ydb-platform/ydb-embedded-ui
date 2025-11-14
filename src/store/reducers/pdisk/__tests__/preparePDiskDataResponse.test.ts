import {EFlag} from '../../../../types/api/enums';
import type {TPDiskInfoResponse} from '../../../../types/api/pdisk';
import {EVDiskState} from '../../../../types/api/vdisk';
import {preparePDiskDataResponse} from '../utils';

describe('preparePDiskDataResponse', () => {
    const rawData = {
        Whiteboard: {
            PDisk: {
                PDiskId: 1,
                ChangeTime: '1738670321505',
                Path: '/ydb_data/pdisk1tmbtrl7c.data',
                Guid: '1',
                Category: '0',
                AvailableSize: '66454552576',
                TotalSize: '100000000000',
                State: 'Normal',
                Device: 'Green',
                Realtime: 'Green',
                SerialNumber: '',
                SystemSize: '2000000000',
                LogUsedSize: '2000000000',
                LogTotalSize: '60000000000',
                EnforcedDynamicSlotSize: '20000000000',
                NumActiveSlots: 1,
            },
            VDisks: [
                {
                    VDiskId: {
                        GroupID: 2181038081,
                        GroupGeneration: 1,
                        Ring: 0,
                        Domain: 0,
                        VDisk: 0,
                    },
                    ChangeTime: '1738672482849',
                    PDiskId: 1,
                    VDiskSlotId: 1001,
                    Guid: '1',
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
                    ReplicationProgress: 1,
                    ReplicationSecondsRemaining: 0,
                    AllocatedSize: '5000000000',
                    AvailableSize: '20000000000',
                    HasUnreadableBlobs: false,
                    IncarnationGuid: '13331041715376219418',
                    InstanceGuid: '18177015420302975983',
                    FrontQueues: 'Green',
                    StoragePoolName: 'dynamic_storage_pool:1',
                    ReadThroughput: '0',
                    WriteThroughput: '0',
                },
            ],
        },
        BSC: {
            PDisk: {
                Type: 'ROT',
                Kind: '0',
                Path: '/ydb_data/pdisk1tmbtrl7c.data',
                Guid: '1',
                BoxId: '1',
                SharedWithOs: false,
                ReadCentric: false,
                AvailableSize: '66454552576',
                TotalSize: '68719476736',
                StatusV2: 'ACTIVE',
                StatusChangeTimestamp: '1737458853219782',
                EnforcedDynamicSlotSize: '20000000000',
                ExpectedSlotCount: 16,
                NumActiveSlots: 1,
                Category: '0',
                DecommitStatus: 'DECOMMIT_NONE',
                State: 'Normal',
            },
            VDisks: [
                {
                    Key: {
                        NodeId: 1,
                        PDiskId: 1,
                        VSlotId: 0,
                    },
                    Info: {
                        GroupId: 0,
                        GroupGeneration: 1,
                        FailRealm: 0,
                        FailDomain: 0,
                        VDisk: 0,
                        AllocatedSize: '1000000000',
                        AvailableSize: '20000000000',
                        StatusV2: 'READY',
                        Kind: 'Default',
                        DiskSpace: 'Green',
                        Replicated: true,
                        State: 'OK',
                    },
                },
            ],
        },
    } as unknown as TPDiskInfoResponse;

    test('Should correctly retrieve slots', () => {
        const preparedData = preparePDiskDataResponse([rawData, {}]);

        expect(preparedData.SlotItems?.length).toEqual(17);
        expect(preparedData.SlotItems?.filter((slot) => slot.SlotType === 'log').length).toEqual(1);
        expect(preparedData.SlotItems?.filter((slot) => slot.SlotType === 'vDisk').length).toEqual(
            1,
        );
        expect(preparedData.SlotItems?.filter((slot) => slot.SlotType === 'empty').length).toEqual(
            15,
        );
    });
    test('Should correctly calculate empty slots size if EnforcedDynamicSlotSize is provided', () => {
        const preparedData = preparePDiskDataResponse([rawData, {}]);

        expect(preparedData.SlotItems?.find((slot) => slot.SlotType === 'empty')?.Total).toEqual(
            20_000_000_000,
        );
    });
    test('Should correctly calculate empty slots size if EnforcedDynamicSlotSize is undefined', () => {
        const data: TPDiskInfoResponse = {
            ...rawData,
            Whiteboard: {
                ...rawData.Whiteboard,
                PDisk: {
                    ...rawData.Whiteboard?.PDisk,
                    EnforcedDynamicSlotSize: undefined,
                },
            },
            BSC: {
                ...rawData.BSC,
                PDisk: {
                    ...rawData.BSC?.PDisk,
                    EnforcedDynamicSlotSize: undefined,
                },
            },
        };
        const preparedData = preparePDiskDataResponse([data, {}]);

        expect(preparedData.SlotItems?.find((slot) => slot.SlotType === 'empty')?.Total).toEqual(
            1_000_000_000,
        );
    });
    test('Should return yellow or red severity for log if its size exceeds thresholds', () => {
        const dataWarning: TPDiskInfoResponse = {
            ...rawData,
            Whiteboard: {
                ...rawData.Whiteboard,
                PDisk: {
                    ...rawData.Whiteboard?.PDisk,
                    LogUsedSize: '90',
                    LogTotalSize: '100',
                },
            },
        };
        const preparedDataWarning = preparePDiskDataResponse([dataWarning, {}]);

        // Yellow severity
        expect(
            preparedDataWarning.SlotItems?.find((slot) => slot.SlotType === 'log')?.Severity,
        ).toEqual(3);

        const dataDanger: TPDiskInfoResponse = {
            ...rawData,
            Whiteboard: {
                ...rawData.Whiteboard,
                PDisk: {
                    ...rawData.Whiteboard?.PDisk,
                    LogUsedSize: '99',
                    LogTotalSize: '100',
                },
            },
        };
        const preparedDataDanger = preparePDiskDataResponse([dataDanger, {}]);

        // Red severity
        expect(
            preparedDataDanger.SlotItems?.find((slot) => slot.SlotType === 'log')?.Severity,
        ).toEqual(5);
    });
    test('Should return yellow or red severity for vdisk if its size exceeds thresholds', () => {
        const dataWarning: TPDiskInfoResponse = {
            ...rawData,
            Whiteboard: {
                ...rawData.Whiteboard,
                VDisks: [
                    {
                        ...rawData.Whiteboard?.VDisks?.[0],
                        AllocatedSize: '90',
                        AvailableSize: '10',
                    },
                ],
            },
        };
        const preparedDataWarning = preparePDiskDataResponse([dataWarning, {}]);

        // Yellow severity
        expect(
            preparedDataWarning.SlotItems?.find((slot) => slot.SlotType === 'vDisk')?.Severity,
        ).toEqual(3);

        const dataDanger: TPDiskInfoResponse = {
            ...rawData,
            Whiteboard: {
                ...rawData.Whiteboard,
                VDisks: [
                    {
                        ...rawData.Whiteboard?.VDisks?.[0],
                        AllocatedSize: '99',
                        AvailableSize: '1',
                    },
                ],
            },
        };
        const preparedDataDanger = preparePDiskDataResponse([dataDanger, {}]);

        // Red severity
        expect(
            preparedDataDanger.SlotItems?.find((slot) => slot.SlotType === 'vDisk')?.Severity,
        ).toEqual(5);
    });

    test('Should not use VDisk statuses for severity calculation', () => {
        const data: TPDiskInfoResponse = {
            ...rawData,
            Whiteboard: {
                ...rawData.Whiteboard,
                VDisks: [
                    {
                        ...rawData.Whiteboard?.VDisks?.[0],
                        DiskSpace: EFlag.Yellow,
                        FrontQueues: EFlag.Orange,
                        VDiskState: EVDiskState.SyncGuidRecoveryError,
                        AllocatedSize: '10',
                        AvailableSize: '90',
                    },
                ],
            },
        };
        const preparedData = preparePDiskDataResponse([data, {}]);

        // Green severity
        expect(preparedData.SlotItems?.find((slot) => slot.SlotType === 'vDisk')?.Severity).toEqual(
            1,
        );
    });

    test('Should use used size as total for VDisk slot when used size exceeds size limit', () => {
        const dataWithExceededVDiskUsage: TPDiskInfoResponse = {
            ...rawData,
            Whiteboard: {
                ...rawData.Whiteboard,
                PDisk: {
                    ...rawData.Whiteboard?.PDisk,
                    EnforcedDynamicSlotSize: '15000000000', // 15GB slot size
                },
                VDisks: [
                    {
                        ...rawData.Whiteboard?.VDisks?.[0],
                        AllocatedSize: '20000000000', // 20GB used (exceeds 15GB slot size)
                        AvailableSize: '0', // 0 available, so slot size should be used as limit
                    },
                ],
            },
            BSC: {
                ...rawData.BSC,
                PDisk: {
                    ...rawData.BSC?.PDisk,
                    EnforcedDynamicSlotSize: '15000000000', // 15GB slot size
                },
            },
        };
        const preparedData = preparePDiskDataResponse([dataWithExceededVDiskUsage, {}]);

        const vDiskSlot = preparedData.SlotItems?.find((slot) => slot.SlotType === 'vDisk');

        expect(vDiskSlot?.Used).toEqual(20_000_000_000); // 20GB used
        // Since used (20GB) > sizeLimit (15GB), total should be set to used size
        expect(vDiskSlot?.Total).toEqual(20_000_000_000); // Total equals used when used exceeds limit
    });
});
