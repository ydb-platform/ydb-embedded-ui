import {EFlag} from '../../../../types/api/enums';
import type {StorageGroupsResponse} from '../../../../types/api/storage';
import type {TEvSystemStateResponse} from '../../../../types/api/systemState';
import {EVDiskState} from '../../../../types/api/vdisk';
import {prepareVDiskDataResponse} from '../utils';

describe('prepareVDiskDataResponse', () => {
    test('provides recipient metrics for a donor page without circular references', () => {
        const response: StorageGroupsResponse = {
            StorageGroups: [
                {
                    VDisks: [
                        {
                            VDiskId: '2181038080-1-0-0-0',
                            NodeId: 42,
                            AllocatedSize: '1000000000',
                            AvailableSize: '3000000000',
                            Whiteboard: {
                                VDiskState: EVDiskState.OK,
                                Replicated: false,
                                FrontQueues: EFlag.Green,
                                VDiskSlotUsage: 82.25,
                            },
                            Donors: [{VDiskId: '2181038080-1-0-1-0', NodeId: 43}],
                        },
                    ],
                },
            ],
        };
        const result = prepareVDiskDataResponse([response, undefined], '2181038080-1-0-1-0');

        expect(result.DonorMode).toBe(true);
        expect(result.Recipient).toMatchObject({
            NodeId: 42,
            StringifiedId: '2181038080-1-0-0-0',
            VDiskState: EVDiskState.OK,
            Replicated: false,
            FrontQueues: EFlag.Green,
            AllocatedSize: 1_000_000_000,
            SizeLimit: 4_000_000_000,
            VDiskSlotUsage: 82.25,
        });
        expect(result.Recipient).not.toHaveProperty('Donors');
        expect(() => JSON.stringify(result)).not.toThrow();
        expect(
            prepareVDiskDataResponse([response, undefined], '2181038080-1-0-0-0').Donors,
        ).toHaveLength(1);
    });

    test('adds NodeRack from prepared node system state', () => {
        const storageGroupResponse = {
            StorageGroups: [
                {
                    StorageGroups: undefined,
                    VDisks: [
                        {
                            VDiskId: '2181038080-1-0-0-0',
                            NodeId: 42,
                            PDisk: {
                                PDiskId: '42-7',
                            },
                        },
                    ],
                },
            ],
        } as unknown as StorageGroupsResponse;

        const nodeResponse = {
            SystemStateInfo: [
                {
                    Host: 'storage-node-07.ydb',
                    Roles: ['Storage'],
                    Location: {
                        Rack: 'Rack-A-12',
                        DataCenter: 'KLG',
                    },
                },
            ],
        } as TEvSystemStateResponse;

        const result = prepareVDiskDataResponse(
            [storageGroupResponse, nodeResponse],
            '2181038080-1-0-0-0',
        );

        expect(result.NodeRack).toBe('Rack-A-12');
        expect(result.NodeDC).toBe('KLG');
        expect(result.NodeHost).toBe('storage-node-07.ydb');
    });
});
