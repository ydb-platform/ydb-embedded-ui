import {act, renderHook} from '@testing-library/react';

import {useStorageColumnsSettings} from './useStorageColumnsSettings';

let mockPreviewEnabled = true;
jest.mock('../../../utils/hooks/useSetting', () => ({
    useSetting: () => [mockPreviewEnabled],
}));
jest.mock('../../../store', () => ({singleClusterMode: true}));

test('accumulates disk and slot maxima across pages without shrinking on smaller chunks', () => {
    mockPreviewEnabled = true;
    const {result, rerender} = renderHook(() => useStorageColumnsSettings());
    const receive = (maxSlotsPerDisk: number, maxDisksPerNode: number) => {
        act(() => {
            result.current.handleDataFetched({
                data: [],
                total: 0,
                found: 0,
                columnsSettings: {maxSlotsPerDisk, maxDisksPerNode},
            });
        });
    };

    receive(6, 1);
    expect(result.current.columnsSettings.pDiskContainerWidth).toBe(33);
    receive(6, 4);
    expect(result.current.columnsSettings.pDiskContainerWidth).toBe(78);
    receive(24, 1);
    expect(result.current.columnsSettings.pDiskContainerWidth).toBe(162);
    receive(1, 1);
    expect(result.current.columnsSettings.pDiskContainerWidth).toBe(162);

    mockPreviewEnabled = false;
    rerender();
    expect(result.current.columnsSettings.pDiskWidth).toBe(238);
    expect(result.current.columnsSettings.pDiskContainerWidth).toBe(1002);
});
