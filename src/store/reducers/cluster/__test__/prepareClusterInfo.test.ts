import {BridgePileGroupStatus, BridgePileState} from '../../../../types/api/cluster';
import type {TClusterInfoV5} from '../../../../types/api/cluster';
import {prepareClusterInfo} from '../utils';

describe('prepareClusterInfo', () => {
    test('filters bridge piles without display data', () => {
        const clusterInfo: TClusterInfoV5 = {
            Version: 5,
            BridgeInfo: {
                Piles: [
                    {},
                    {Name: '   '},
                    {GroupStatuses: {[BridgePileGroupStatus.FULL]: 0}},
                    {Nodes: 0},
                    {State: BridgePileState.UNSPECIFIED},
                    {GroupStatuses: {[BridgePileGroupStatus.FULL]: 2}},
                    {Name: 'r1'},
                ],
            },
        };

        const result = prepareClusterInfo(clusterInfo) as TClusterInfoV5;

        expect(result.BridgeInfo?.Piles).toEqual([
            {Nodes: 0},
            {State: BridgePileState.UNSPECIFIED},
            {GroupStatuses: {[BridgePileGroupStatus.FULL]: 2}},
            {Name: 'r1'},
        ]);
    });

    test('keeps cluster info reference when bridge piles do not need normalization', () => {
        const clusterInfo: TClusterInfoV5 = {
            Version: 5,
            BridgeInfo: {
                Piles: [{Name: 'r1'}],
            },
        };

        expect(prepareClusterInfo(clusterInfo)).toBe(clusterInfo);
    });
});
