import type {TNodesInfo} from '../../../../types/api/nodes';
import {prepareStorageNodesResponse} from '../utils';

describe('prepareStorageNodesResponse', () => {
    test('Should generate a PDisk ID using the containing node ID', () => {
        const response = {
            TotalNodes: '1',
            FoundNodes: '1',
            Nodes: [{NodeId: 715, SystemState: {}, PDisks: [{PDiskId: 1000}]}],
        } satisfies TNodesInfo;

        expect(prepareStorageNodesResponse(response).nodes?.[0].PDisks?.[0]).toEqual(
            expect.objectContaining({NodeId: 715, PDiskId: 1000, StringifiedId: '715-1000'}),
        );
    });

    test('Should preserve zero and keep invalid aggregate capacity metrics absent', () => {
        const response = {
            TotalNodes: '3',
            FoundNodes: '3',
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
                {
                    NodeId: 3,
                    SystemState: {},
                    MaxPDiskUsage: null as unknown as number,
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
        expect(prepareStorageNodesResponse(response).nodes?.[2]).toEqual(
            expect.objectContaining({
                MaxPDiskUsage: undefined,
            }),
        );
    });
});
