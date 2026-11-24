import type {TNodesInfo} from '../../../../types/api/nodes';
import {prepareStorageNodesResponse} from '../utils';

describe('prepareStorageNodesResponse', () => {
    test('Should use the system state pile name when the top-level pile name is missing', () => {
        const systemState = {Location: {BridgePileName: 'pile1'}};
        const response = {
            TotalNodes: '4',
            FoundNodes: '4',
            Nodes: [
                {NodeId: 1, SystemState: systemState},
                {NodeId: 2, PileName: '', SystemState: systemState},
                {NodeId: 3, PileName: 'pile2', SystemState: systemState},
                {NodeId: 4, SystemState: {}},
            ],
        } satisfies TNodesInfo;

        expect(prepareStorageNodesResponse(response).nodes?.map(({PileName}) => PileName)).toEqual([
            'pile1',
            'pile1',
            'pile2',
            undefined,
        ]);
    });

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

    test('Should keep what the handler reported about the response', () => {
        const response = {
            TotalNodes: '1',
            FoundNodes: '1',
            Nodes: [{NodeId: 1, SystemState: {}}],
            Problems: ['bsc-timeout', 'bsc-storage-slots-no-data'],
            NeedFilter: true,
            NeedGroup: true,
        } satisfies TNodesInfo;

        expect(prepareStorageNodesResponse(response).dataQuality).toEqual({
            problems: ['bsc-timeout', 'bsc-storage-slots-no-data'],
            needFilter: true,
            needSort: false,
            needGroup: true,
        });
    });
});
