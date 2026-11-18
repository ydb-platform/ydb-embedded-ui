import {BridgeSyncStatus} from '../../../../types/api/cluster';

import {getBridgeDatabaseCounts, getBridgeNodesProgress} from './bridgeInfo';

describe('Bridge cards data', () => {
    test('reads the cluster-wide synchronization counts', () => {
        expect(
            getBridgeDatabaseCounts({
                DatabaseCountsBySyncStatus: {SYNCED: '12', SYNCING: '3'},
            }),
        ).toEqual([
            {status: BridgeSyncStatus.SYNCED, count: 12},
            {status: BridgeSyncStatus.SYNCING, count: 3},
        ]);
    });

    test('does not interpret legacy per-pile counts as cluster-wide counts', () => {
        const legacyResponse = {
            Piles: [
                {Name: 'r1', DatabaseCountsBySyncStatus: {SYNCED: '5', SYNCING: '1'}},
                {Name: 'r2', DatabaseCountsBySyncStatus: {SYNCED: '5', SYNCING: '1'}},
            ],
        };
        expect(getBridgeDatabaseCounts(legacyResponse)).toBeUndefined();
        expect(
            getBridgeDatabaseCounts({...legacyResponse, DatabaseCountsBySyncStatus: {}}),
        ).toEqual([]);
    });

    test('keeps zero counts and skips missing or unrecognized statuses', () => {
        expect(getBridgeDatabaseCounts({Piles: [{}]})).toBeUndefined();
        expect(
            getBridgeDatabaseCounts({
                DatabaseCountsBySyncStatus: {
                    SYNCED: '0',
                    SYNCING: 'invalid',
                    UNKNOWN: 1,
                    NEW_BACKEND_STATUS: 2,
                },
            }),
        ).toEqual([
            {status: BridgeSyncStatus.SYNCED, count: 0},
            {status: BridgeSyncStatus.UNKNOWN, count: 1},
        ]);
        expect(
            getBridgeDatabaseCounts({DatabaseCountsBySyncStatus: {NEW_BACKEND_STATUS: 2}}),
        ).toEqual([]);
    });

    test('distinguishes no alive nodes, no nodes and unavailable alive counts', () => {
        expect(getBridgeNodesProgress(8, 6)).toBe(75);
        expect(getBridgeNodesProgress(8, 0)).toBe(0);
        expect(getBridgeNodesProgress(0, 0)).toBe(0);
        expect(getBridgeNodesProgress(8, undefined)).toBeUndefined();
        expect(getBridgeNodesProgress(undefined, 0)).toBeUndefined();
        expect(getBridgeNodesProgress(0, 1)).toBe(0);
    });
});
