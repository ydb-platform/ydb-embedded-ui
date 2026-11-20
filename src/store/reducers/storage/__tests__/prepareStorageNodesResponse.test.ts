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
});
