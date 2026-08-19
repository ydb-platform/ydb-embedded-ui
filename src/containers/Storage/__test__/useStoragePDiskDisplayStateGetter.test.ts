import {ArrowUpFromLine, CircleQuestionFill, CircleXmark, Wrench} from '@gravity-ui/icons';
import {renderHook} from '@testing-library/react';

import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {TPDiskState} from '../../../types/api/pdisk';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../../../utils/disks/constants';
import {EXPERT_MODE_ALL_PDISK_WIDTH} from '../Disks/constants';
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

const healthyAllModePDisk = {
    AllocatedPercent: 25,
    WhiteboardSize: {AllocatedPercent: 40},
    State: TPDiskState.Normal,
    PDiskCapacityAlert: ECapacityAlert.GREEN,
    DriveStatus: 'ACTIVE' as const,
    DecommitStatus: 'DECOMMIT_NONE' as const,
    MaintenanceStatus: 'NO_REQUEST' as const,
    Device: EFlag.Green,
    Realtime: EFlag.Green,
};

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
        {
            groupBy: PDisksGroupBy.All,
            mode: 'all',
            allocatedPercent: 40,
            width: EXPERT_MODE_ALL_PDISK_WIDTH,
        },
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
            if (groupBy === PDisksGroupBy.All) {
                expect(displayState.showAllocatedPercentLabel).toBe(false);
                expect(displayState.allMode).toEqual(
                    expect.objectContaining({
                        indicators: expect.any(Object),
                    }),
                );
            }
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

    test('uses top-level BSC DriveStatus without Whiteboard in Drive mode', () => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.Drive);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(result.current({AllocatedPercent: 25, DriveStatus: 'BROKEN'})).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
            icon: CircleXmark,
            mode: 'drive',
            showNoDataPlaceholder: false,
            allocatedPercent: undefined,
            width: 55,
        });
    });

    test('uses top-level BSC DecommitStatus without Whiteboard in Decommit mode', () => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.Decommit);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(
            result.current({AllocatedPercent: 25, DecommitStatus: 'DECOMMIT_IMMINENT'}),
        ).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
            icon: ArrowUpFromLine,
            mode: 'decommit',
            showNoDataPlaceholder: false,
            allocatedPercent: undefined,
            width: 55,
        });
    });

    test('uses top-level BSC MaintenanceStatus without Whiteboard in Maintenance mode', () => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.Maintenance);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(
            result.current({
                AllocatedPercent: 25,
                MaintenanceStatus: 'LONG_TERM_MAINTENANCE_PLANNED',
            }),
        ).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
            icon: Wrench,
            mode: 'maintenance',
            showNoDataPlaceholder: false,
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

    test('marks the exact healthy All-mode combination without issues and keeps only the capacity slot populated', () => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.All);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(result.current(healthyAllModePDisk)).toMatchObject({
            mode: 'all',
            width: EXPERT_MODE_ALL_PDISK_WIDTH,
            allocatedPercent: 40,
            showAllocatedPercentLabel: false,
            iconPlacement: 'inline',
            allMode: {
                hasIssues: false,
                indicators: {
                    capacityAlert: 'G',
                },
            },
        });
    });

    test.each([
        {name: 'state', override: {State: TPDiskState.Initial}},
        {name: 'capacity alert', override: {PDiskCapacityAlert: ECapacityAlert.RED}},
        {name: 'drive status', override: {DriveStatus: 'FAULTY' as const}},
        {name: 'decommit status', override: {DecommitStatus: 'DECOMMIT_IMMINENT' as const}},
        {
            name: 'maintenance status',
            override: {MaintenanceStatus: 'LONG_TERM_MAINTENANCE_PLANNED' as const},
        },
        {name: 'device flag', override: {Device: EFlag.Red}},
        {name: 'realtime flag', override: {Realtime: EFlag.Yellow}},
    ])('marks All mode as having issues when $name is non-healthy', ({override}) => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.All);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(result.current({...healthyAllModePDisk, ...override}).allMode?.hasIssues).toBe(true);
    });

    test('uses question indicators for partially missing All-mode Whiteboard fields', () => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.All);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        const displayState = result.current({
            ...healthyAllModePDisk,
            State: undefined,
            PDiskCapacityAlert: undefined,
            DriveStatus: undefined,
            DecommitStatus: undefined,
            MaintenanceStatus: undefined,
            Device: undefined,
            Realtime: undefined,
        });

        expect(displayState.icon).toBe(CircleQuestionFill);
        expect(displayState.allMode?.hasIssues).toBe(true);
        expect(displayState.allMode?.indicators).toMatchObject({
            capacityAlert: CircleQuestionFill,
            drive: CircleQuestionFill,
            decommit: CircleQuestionFill,
            maintenance: CircleQuestionFill,
        });
        expect(displayState.allMode?.indicators.device).toHaveLength(2);
        expect(
            displayState.allMode?.indicators.device?.every(({icon}) => icon === CircleQuestionFill),
        ).toBe(true);
    });

    test('shows the no-data All-mode policy without Whiteboard and keeps the BSC allocation fallback', () => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.All);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        expect(result.current({AllocatedPercent: 25})).toMatchObject({
            mode: 'all',
            width: EXPERT_MODE_ALL_PDISK_WIDTH,
            showNoDataPlaceholder: true,
            allocatedPercent: 25,
            showAllocatedPercentLabel: false,
            iconPlacement: 'inline',
            allMode: {indicators: {}},
        });
        expect(result.current({AllocatedPercent: 25}).allMode?.hasIssues).toBeUndefined();
    });

    test('uses top-level BSC statuses in All mode without Whiteboard instead of the fully missing contract', () => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.All);
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        const displayState = result.current({
            AllocatedPercent: 25,
            DriveStatus: 'BROKEN',
            DecommitStatus: 'DECOMMIT_IMMINENT',
            MaintenanceStatus: 'NO_REQUEST',
        });

        expect(displayState).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
            icon: CircleQuestionFill,
            mode: 'all',
            width: EXPERT_MODE_ALL_PDISK_WIDTH,
            allocatedPercent: 25,
            showAllocatedPercentLabel: false,
            showNoDataPlaceholder: false,
            iconPlacement: 'overlap',
            allMode: {
                hasIssues: true,
                indicators: {
                    capacityAlert: CircleQuestionFill,
                    drive: CircleXmark,
                    decommit: ArrowUpFromLine,
                },
            },
        });
        expect(displayState.allMode?.indicators.maintenance).toBeUndefined();
        expect(displayState.allMode?.indicators.device).toHaveLength(2);
        expect(
            displayState.allMode?.indicators.device?.every(({icon}) => icon === CircleQuestionFill),
        ).toBe(true);
    });

    test('hides only the inactive All-mode capacity indicator without suppressing issue detection', () => {
        mockUsePDisksGroupByParam.mockReturnValue(PDisksGroupBy.All);
        mockUseSpaceLegendSelection.mockReturnValue(new Set([ECapacityAlert.RED]));
        const {result} = renderHook(() => useStoragePDiskDisplayStateGetter());

        const displayState = result.current({
            ...healthyAllModePDisk,
            PDiskCapacityAlert: ECapacityAlert.RED,
        });

        expect(displayState.allMode?.hasIssues).toBe(true);
        expect(displayState.allMode?.indicators.capacityAlert).toBeUndefined();
        expect(displayState.allMode?.indicators.drive).toBeUndefined();
    });
});
