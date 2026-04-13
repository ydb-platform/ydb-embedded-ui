import type {StorageGroupsResponse} from '../../../../types/api/storage';
import type {TEvSystemStateResponse} from '../../../../types/api/systemState';
import {prepareVDiskDataResponse} from '../utils';

describe('prepareVDiskDataResponse', () => {
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
