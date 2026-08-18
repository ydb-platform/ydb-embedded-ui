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

    test('returns renderer-ready policy outside Expert Mode', () => {
        mockUseIsStorageExpertMode.mockReturnValue(false);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(result.current({AllocatedPercent: 25})).toMatchObject({
            mode: undefined,
            isLegendInactive: false,
            showNoDataPlaceholder: true,
            allocatedPercent: 25,
        });
    });

    test.each([
        {groupBy: PDisksGroupBy.State, mode: 'state', allocatedPercent: undefined, width: 55},
        {groupBy: PDisksGroupBy.Space, mode: 'space', allocatedPercent: 40, width: 55},
        {groupBy: PDisksGroupBy.Drive, mode: 'drive', allocatedPercent: undefined, width: 55},
        {
            groupBy: PDisksGroupBy.Decommit,
            mode: 'decommit',
            allocatedPercent: undefined,
            width: 55,
        },
        {
            groupBy: PDisksGroupBy.Maintenance,
            mode: 'maintenance',
            allocatedPercent: undefined,
            width: 55,
        },
        {groupBy: PDisksGroupBy.Device, mode: 'device', allocatedPercent: undefined, width: 55},
        {groupBy: PDisksGroupBy.All, mode: undefined, allocatedPercent: 25, width: undefined},
    ] as const)(
        'returns renderer-ready policy for $groupBy mode',
        ({groupBy, mode, allocatedPercent, width}) => {
            mockUsePDisksGroupByParam.mockReturnValue(groupBy);
            const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

            const displayState = result.current({
                AllocatedPercent: 25,
                WhiteboardSize: {AllocatedPercent: 40},
            });

            expect(displayState.mode).toBe(mode);
            expect(displayState.allocatedPercent).toBe(allocatedPercent);
            expect(displayState.width).toBe(width);
            expect(displayState.isLegendInactive).toBe(false);
        },
    );

    test('falls back to the BSC percentage when the Whiteboard percentage is not finite', () => {
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(
            result.current({
                AllocatedPercent: 25,
                WhiteboardSize: {AllocatedPercent: Number.NaN},
            }),
        ).toHaveProperty('allocatedPercent', 25);
    });

    test.each([
        {groupBy: PDisksGroupBy.Drive, mode: 'drive'},
        {groupBy: PDisksGroupBy.Decommit, mode: 'decommit'},
        {groupBy: PDisksGroupBy.Maintenance, mode: 'maintenance'},
    ] as const)('shows N/D without Whiteboard data in $groupBy mode', ({groupBy, mode}) => {
        mockUsePDisksGroupByParam.mockReturnValue(groupBy);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(result.current({AllocatedPercent: 25})).toMatchObject({
            severity: 0,
            icon: undefined,
            mode,
            showNoDataPlaceholder: true,
            allocatedPercent: undefined,
            width: 55,
        });
    });

    test('keeps the BSC allocation fallback without Whiteboard data in Space mode', () => {
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(result.current({AllocatedPercent: 25})).toMatchObject({
            mode: 'space',
            showNoDataPlaceholder: false,
            allocatedPercent: 25,
            width: 55,
        });
    });

    test('prefers the finite Whiteboard percentage in Space mode', () => {
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(
            result.current({
                AllocatedPercent: 25,
                WhiteboardSize: {AllocatedPercent: 40},
            }),
        ).toMatchObject({
            mode: 'space',
            allocatedPercent: 40,
            width: 55,
        });
    });
});
