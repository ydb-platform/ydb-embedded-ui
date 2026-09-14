import {act, renderHook} from '@testing-library/react';

import {getNodes} from '../../../Nodes/getNodes';
import {getStorageNodes} from '../../PaginatedStorageNodesTable/getNodes';
import type {StorageNodesPaginatedTableData} from '../../types';
import {getStorageNodesSelectionKey} from '../getStorageNodesSelectionKey';
import {useStorageColumnsSettings} from '../useStorageColumnsSettings';

jest.mock('../../../../utils/hooks/useSetting', () => ({
    useSetting: jest.fn(),
}));
jest.mock('../../../../store', () => ({
    backend: 'https://first.test',
    clusterName: 'first',
    environment: 'test',
}));
jest.mock('../../PDisk', () => ({PDisk: () => null}));

const {useSetting} = jest.requireMock('../../../../utils/hooks/useSetting');

function response(selectionKey: string, diskCount: number): StorageNodesPaginatedTableData {
    return {
        selectionKey,
        data: [
            {
                NodeId: 1,
                Missing: 0,
                MaximumSlotsPerDisk: 1,
                MaximumDisksPerNode: diskCount,
                PDisks: Array.from({length: diskCount}, (_, index) => ({
                    NodeId: 1,
                    PDiskId: index + 1,
                    StringifiedId: `1-${index + 1}`,
                })),
            },
        ],
        found: 1,
        total: 1,
        columnsSettings: {maxDisksPerNode: diskCount, maxSlotsPerDisk: 1},
    };
}

for (const preview of [true, false]) {
    test(`resets selection maxima and retains chunk maxima (preview: ${preview})`, () => {
        useSetting.mockReturnValue([preview]);
        const {result} = renderHook(useStorageColumnsSettings);
        const fetch = (key: string, count: number) =>
            act(() => {
                result.current.handleDataFetched(response(key, count));
            });
        fetch('all', 12);
        const wide = result.current.columnsSettings.pDiskContainerWidth ?? 0;
        fetch('all', 1);
        expect(result.current.columnsSettings.pDiskContainerWidth).toBe(wide);
        fetch('filtered', 1);
        const narrow = result.current.columnsSettings.pDiskContainerWidth;
        expect(narrow).toBeLessThan(wide);
        fetch('filtered', 12);
        expect(result.current.columnsSettings.pDiskContainerWidth).toBe(wide);
        fetch('other-cluster', 1);
        expect(result.current.columnsSettings.pDiskContainerWidth).toBe(narrow);
        fetch('all', 12);
        expect(result.current.columnsSettings.pDiskContainerWidth).toBe(wide);
    });
}

test('selection keys share grouped widths but distinguish filters and runtime identity', () => {
    const filters = {searchValue: 'node', database: '/db', filterGroupBy: 'Host'};
    const key = () => getStorageNodesSelectionKey(filters, 'any', true);
    const initial = key();
    expect(getStorageNodesSelectionKey({...filters, filterGroup: 'a'}, 'any', true)).toBe(initial);
    expect(getStorageNodesSelectionKey({...filters, filterGroup: 'b'}, 'any', true)).toBe(initial);
    for (const field of ['searchValue', 'database', 'filterGroupBy']) {
        expect(getStorageNodesSelectionKey({...filters, [field]: 'other'}, 'any', true)).not.toBe(
            initial,
        );
    }
    const runtime = jest.requireMock('../../../../store');
    for (const field of ['backend', 'clusterName', 'environment']) {
        const previous = runtime[field];
        runtime[field] = 'other';
        expect(key()).not.toBe(initial);
        runtime[field] = previous;
    }
});

for (const fetchNodes of [getNodes, getStorageNodes]) {
    test(`${fetchNodes.name} captures cluster identity before the request completes`, async () => {
        const runtime = jest.requireMock('../../../../store');
        const originalApi = window.api;
        const originalBackend = runtime.backend;
        const getNodesMock = jest.fn().mockResolvedValue({Nodes: []});
        window.api = {
            ...originalApi,
            viewer: {getNodes: getNodesMock},
        } as unknown as typeof window.api;
        try {
            const args = {limit: 100, offset: 0, columnsIds: ['PDisks']};
            const first = (await fetchNodes(args)) as StorageNodesPaginatedTableData;
            const pending = fetchNodes({...args, offset: 100});
            runtime.backend = 'https://second.test';
            const secondChunk = (await pending) as StorageNodesPaginatedTableData;
            const otherCluster = (await fetchNodes(args)) as StorageNodesPaginatedTableData;
            expect(first.selectionKey).toEqual(expect.any(String));
            expect(secondChunk.selectionKey).toBe(first.selectionKey);
            expect(otherCluster.selectionKey).not.toBe(first.selectionKey);
        } finally {
            window.api = originalApi;
            runtime.backend = originalBackend;
        }
    });
}
