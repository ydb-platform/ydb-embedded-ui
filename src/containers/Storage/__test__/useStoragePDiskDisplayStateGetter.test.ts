import {renderHook} from '@testing-library/react';

import {PDisksGroupBy} from '../StorageExpertModePanel/constants';
import {useStoragePDiskDisplayStateGetter} from '../useStoragePDiskDisplayStateGetter';

const mockUseIsStorageExpertMode = jest.fn();
const mockUsePDisksGroupByParam = jest.fn();
const mockUseSpaceLegendSelection = jest.fn();

jest.mock('../useStorageQueryParams', () => ({
    useIsStorageExpertMode: () => mockUseIsStorageExpertMode(),
    usePDisksGroupByParam: () => mockUsePDisksGroupByParam(),
}));

jest.mock('../StorageExpertModePanel/components/useSpaceLegendSelection', () => ({
    useSpaceLegendSelection: () => mockUseSpaceLegendSelection(),
}));

describe('useStoragePDiskDisplayStateGetter', () => {
    beforeEach(() => {
        mockUseIsStorageExpertMode.mockReturnValue(true);
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.Space);
        mockUseSpaceLegendSelection.mockReturnValue(new Set());
    });

    test('falls back to the BSC percentage when the Whiteboard percentage is not finite', () => {
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(
            result.current({
                AllocatedPercent: 25,
                WhiteboardSize: {AllocatedPercent: Number.NaN},
            }),
        ).toHaveProperty('allocatedPercent', 25);
    });

    test('prefers the finite Whiteboard percentage in Space mode', () => {
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(
            result.current({
                AllocatedPercent: 25,
                WhiteboardSize: {AllocatedPercent: 40},
            }),
        ).toHaveProperty('allocatedPercent', 40);
    });
});
