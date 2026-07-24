import type {TNodesInfo} from '../../../../types/api/nodes';
import {prepareStorageNodesResponse} from '../utils';

describe('prepareStorageNodesResponse', () => {
    test('Should preserve zero and keep invalid aggregate capacity metrics absent', () => {
        const response = {
            TotalNodes: '2',
            FoundNodes: '2',
            Nodes: [
                {
                    NodeId: 1,
                    SystemState: {},
                    MaxPDiskUsage: 0,
                    MaxVDiskSlotUsage: 0,
                    MaxVDiskRawUsage: 0,
                },
                {
                    NodeId: 2,
                    SystemState: {},
                    MaxPDiskUsage: '' as unknown as number,
                    MaxVDiskSlotUsage: ' ' as unknown as number,
                    MaxVDiskRawUsage: Number.NaN,
                },
            ],
        } satisfies TNodesInfo;

        expect(prepareStorageNodesResponse(response).nodes?.[0]).toEqual(
            expect.objectContaining({
                MaxPDiskUsage: 0,
                MaxVDiskSlotUsage: 0,
                MaxVDiskRawUsage: 0,
            }),
        );
        expect(prepareStorageNodesResponse(response).nodes?.[1]).toEqual(
            expect.objectContaining({
                MaxPDiskUsage: undefined,
                MaxVDiskSlotUsage: undefined,
                MaxVDiskRawUsage: undefined,
            }),
        );
    });
});
