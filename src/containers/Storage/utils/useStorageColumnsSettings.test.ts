import {act, renderHook} from '@testing-library/react';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {getNodes} from '../../Nodes/getNodes';

import {useStorageColumnsSettings} from './useStorageColumnsSettings';

test('updates disk widths from fetched pages and retains both maxima on smaller pages', async () => {
    const originalApi = window.api;
    const fetchNodes = jest.fn();
    window.api = {viewer: {getNodes: fetchNodes}} as unknown as YdbEmbeddedAPI;
    const {result} = renderHook(() => useStorageColumnsSettings());
    try {
        for (const [disks, slots, diskWidth, columnWidth] of [
            [1, 6, 165, 185],
            [4, 6, 165, 710],
            [1, 24, 238, 1002],
            [1, 1, 238, 1002],
        ]) {
            fetchNodes.mockResolvedValueOnce({
                Nodes: [
                    {
                        NodeId: 1,
                        PDisks: Array.from({length: disks}, (_, i) => ({PDiskId: i + 1})),
                        VDisks: Array.from({length: slots}, () => ({PDiskId: 1})),
                    },
                ],
            });
            await act(async () => {
                result.current.handleDataFetched(
                    await getNodes({
                        limit: 1,
                        offset: fetchNodes.mock.calls.length,
                        columnsIds: ['PDisks'],
                    }),
                );
            });
            expect(result.current.columnsSettings).toEqual({
                pDiskWidth: diskWidth,
                pDiskContainerWidth: columnWidth,
            });
        }
    } finally {
        window.api = originalApi;
    }
});
