import React from 'react';

import {CircleCheckFill, CircleQuestionFill, CircleXmarkFill, Ellipsis} from '@gravity-ui/icons';
import {render, renderHook, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import {useStorageVDiskDisplayStateGetter} from '../../../containers/Storage/useStorageVDiskDisplayStateGetter';
import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {EVDiskState} from '../../../types/api/vdisk';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../../../utils/disks/constants';
import {VDisksGroupBy} from '../../../utils/disks/groupBy';
import {VDisk} from '../VDisk';

const mockUseIsStorageExpertMode = jest.fn();
const mockUseVDisksGroupByParam = jest.fn();
const mockUseSpaceLegendSelection = jest.fn();

jest.mock('../../../routes', () => ({
    useVDiskPagePath: () => () => '/vdisk',
}));

jest.mock('../../../containers/Storage/useStorageQueryParams', () => ({
    useIsStorageExpertMode: () => mockUseIsStorageExpertMode(),
    useVDisksGroupByParam: () => mockUseVDisksGroupByParam(),
}));

jest.mock(
    '../../../containers/Storage/StorageExpertModePanel/components/useSpaceLegendSelection',
    () => ({
        useSpaceLegendSelection: () => mockUseSpaceLegendSelection(),
    }),
);

jest.mock('../../HoverPopup/HoverPopup', () => ({
    HoverPopup: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}));

jest.mock('../../DiskStateProgressBar/DiskStateProgressBar', () => ({
    DiskStateProgressBar: ({content, striped}: {content?: React.ReactNode; striped?: boolean}) => (
        <div data-testid="disk-progress" data-striped={striped ? 'true' : 'false'}>
            {content}
        </div>
    ),
}));

function renderVDisk(props: React.ComponentProps<typeof VDisk>) {
    return render(
        <MemoryRouter>
            <VDisk {...props} />
        </MemoryRouter>,
    );
}

describe('VDisk', () => {
    beforeEach(() => {
        mockUseIsStorageExpertMode.mockReset();
        mockUseVDisksGroupByParam.mockReset();
        mockUseSpaceLegendSelection.mockReset();
    });

    test('does not subscribe to Storage state in default mode', () => {
        renderVDisk({data: {}});

        expect(mockUseIsStorageExpertMode).not.toHaveBeenCalled();
        expect(mockUseVDisksGroupByParam).not.toHaveBeenCalled();
        expect(mockUseSpaceLegendSelection).not.toHaveBeenCalled();
    });

    test('keeps N/D fallback in default mode', () => {
        renderVDisk({data: {}});

        expect(screen.getByTestId('disk-progress')).toHaveTextContent('N/D');
    });

    test('does not mark no data vdisk as replicating in expert modes', () => {
        renderVDisk({
            data: {Replicated: false},
            getDisplayState: () => ({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                icon: undefined,
                mode: 'space',
                striped: false,
                iconPlacement: 'inline',
            }),
        });

        expect(screen.getByTestId('disk-progress')).toHaveAttribute('data-striped', 'false');
    });

    test('uses N/D as no data placeholder', () => {
        renderVDisk({
            data: {},
            getDisplayState: () => ({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                icon: undefined,
                mode: 'state',
                showNoDataPlaceholder: true,
                striped: false,
                iconPlacement: 'inline',
            }),
        });

        expect(screen.getByTestId('disk-progress')).toHaveTextContent('N/D');
    });

    test('does not use N/D when only State data is unavailable in expert mode', () => {
        renderVDisk({
            data: {
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
            },
            getDisplayState: () => ({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                icon: undefined,
                mode: 'state',
                showNoDataPlaceholder: false,
                striped: false,
                iconPlacement: 'inline',
            }),
        });

        expect(screen.getByTestId('disk-progress')).not.toHaveTextContent('N/D');
    });

    test.each(['space', 'frontQueues', 'compaction'] as const)(
        'does not render N/D when %s mode uses its status indicator',
        (mode) => {
            renderVDisk({
                data: {},
                getDisplayState: () => ({
                    severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                    icon: CircleQuestionFill,
                    mode,
                    showNoDataPlaceholder: false,
                    striped: false,
                    iconPlacement: 'inline',
                }),
            });

            expect(screen.getByTestId('disk-progress')).not.toHaveTextContent('N/D');
        },
    );

    test('exposes healthy All-mode statuses in the link accessible name', () => {
        renderVDisk({
            data: {
                StringifiedId: '1-1-0-0-0',
                VDiskState: EVDiskState.OK,
                Replicated: true,
                CapacityAlert: ECapacityAlert.GREEN,
                FrontQueues: EFlag.Green,
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Green},
                    LevelRank: {Flag: EFlag.Green},
                },
                AllocatedPercent: 50,
            },
            getDisplayState: () => ({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
                icon: undefined,
                mode: 'all',
                striped: false,
                iconPlacement: 'inline',
                allMode: {hasIssues: false, indicators: {}},
            }),
        });

        expect(
            screen.getByRole('link', {
                name: 'VDisk 1-1-0-0-0. Health: healthy. State: OK. Replication: complete. Capacity alert: GREEN. Front queues: Green. Fresh compaction: Green. Level compaction: Green. Allocated: 50%.',
            }),
        ).toBeInTheDocument();
    });

    test('exposes All-mode issues and raw statuses in the link accessible name', () => {
        renderVDisk({
            data: {
                StringifiedId: '2-1-0-0-1',
                VDiskState: EVDiskState.Initial,
                CapacityAlert: ECapacityAlert.LIGHTYELLOW,
                FrontQueues: EFlag.Yellow,
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Orange},
                    LevelRank: {Flag: EFlag.Red},
                },
                AllocatedPercent: 75,
            },
            getDisplayState: () => ({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
                icon: undefined,
                mode: 'all',
                striped: false,
                iconPlacement: 'inline',
                allMode: {hasIssues: true, indicators: {}},
            }),
        });

        expect(
            screen.getByRole('link', {
                name: 'VDisk 2-1-0-0-1. Health: issues detected. State: Initial. Replication: N/D. Capacity alert: LIGHT_YELLOW. Front queues: Yellow. Fresh compaction: Orange. Level compaction: Red. Allocated: 75%.',
            }),
        ).toBeInTheDocument();
    });

    test('exposes active replication in the All-mode link accessible name', () => {
        renderVDisk({
            data: {
                StringifiedId: '3-1-0-0-2',
                Replicated: false,
            },
            getDisplayState: () => ({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue,
                icon: undefined,
                mode: 'all',
                striped: true,
                iconPlacement: 'inline',
                allMode: {hasIssues: false, indicators: {}},
            }),
        });

        expect(screen.getByRole('link', {name: /Replication: in progress/})).toBeInTheDocument();
    });
});

describe('useStorageVDiskDisplayStateGetter', () => {
    const ALL_GREEN_VDISK = {
        VDiskId: {
            GroupID: 1,
            GroupGeneration: 1,
            Ring: 0,
            Domain: 0,
            VDisk: 0,
        },
        VDiskState: EVDiskState.OK,
        CapacityAlert: ECapacityAlert.GREEN,
        FrontQueues: EFlag.Green,
        SatisfactionRank: {
            FreshRank: {Flag: EFlag.Green},
            LevelRank: {Flag: EFlag.Green},
        },
    };
    const POLICY_VDISK = {
        ...ALL_GREEN_VDISK,
        Severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        Replicated: true,
        AllocatedPercent: 42,
    };

    beforeEach(() => {
        mockUseIsStorageExpertMode.mockReturnValue(true);
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.State);
        mockUseSpaceLegendSelection.mockReturnValue(new Set());
    });

    test('returns renderer-ready policy outside Expert Mode', () => {
        mockUseIsStorageExpertMode.mockReturnValue(false);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(result.current(POLICY_VDISK)).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
            mode: undefined,
            isLegendInactive: false,
            allocatedPercent: 42,
            showAllocatedPercentLabel: true,
            striped: false,
            iconPlacement: 'inline',
        });
    });

    test.each([
        {
            groupBy: VDisksGroupBy.State,
            mode: 'state',
            allocatedPercent: undefined,
            showAllocatedPercentLabel: true,
            allMode: undefined,
        },
        {
            groupBy: VDisksGroupBy.Space,
            mode: 'space',
            allocatedPercent: undefined,
            showAllocatedPercentLabel: true,
            allMode: undefined,
        },
        {
            groupBy: VDisksGroupBy.Compaction,
            mode: 'compaction',
            allocatedPercent: undefined,
            showAllocatedPercentLabel: true,
            allMode: undefined,
        },
        {
            groupBy: VDisksGroupBy.All,
            mode: 'all',
            allocatedPercent: 42,
            showAllocatedPercentLabel: false,
            allMode: {hasIssues: false},
        },
    ] as const)(
        'returns renderer-ready policy for $mode mode',
        ({groupBy, mode, allocatedPercent, showAllocatedPercentLabel, allMode}) => {
            mockUseVDisksGroupByParam.mockReturnValue(groupBy);
            const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

            expect(result.current(POLICY_VDISK)).toMatchObject({
                mode,
                isLegendInactive: false,
                allocatedPercent,
                showAllocatedPercentLabel,
                striped: false,
                iconPlacement: 'inline',
                ...(allMode ? {allMode} : {}),
            });
        },
    );

    test('marks Space mode inactive through display-state policy', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.Space);
        mockUseSpaceLegendSelection.mockReturnValue(new Set([ECapacityAlert.GREEN]));
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(result.current(POLICY_VDISK)).toHaveProperty('isLegendInactive', true);
    });

    test('does not request N/D when only State is unavailable in expert mode', () => {
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
            }),
        ).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
            icon: CircleQuestionFill,
            mode: 'state',
            showNoDataPlaceholder: false,
            allocatedPercent: undefined,
            striped: false,
            iconPlacement: 'inline',
        });
    });

    test('requests N/D without a Capacity Alert indicator when Whiteboard is unavailable', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        const displayState = result.current({});

        expect(displayState).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
            icon: undefined,
            mode: 'all',
            showNoDataPlaceholder: true,
            allMode: {
                indicators: {},
            },
        });
        expect(displayState).not.toHaveProperty('allMode.hasIssues');
    });

    test('returns renderer-ready policy for Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
                VDiskState: EVDiskState.OK,
                Replicated: true,
                AllocatedPercent: 42,
            }),
        ).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
            mode: 'all',
            showNoDataPlaceholder: false,
            allocatedPercent: 42,
            showAllocatedPercentLabel: false,
            striped: false,
            iconPlacement: 'inline',
        });
    });

    test('keeps an all-green VDisk healthy regardless of inactive legend selectors', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        mockUseSpaceLegendSelection.mockReturnValue(new Set([ECapacityAlert.GREEN]));
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(result.current(ALL_GREEN_VDISK)).toHaveProperty('allMode.hasIssues', false);
    });

    test('treats Blue FrontQueues as an issue in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(result.current({...ALL_GREEN_VDISK, FrontQueues: EFlag.Blue})).toHaveProperty(
            'allMode.hasIssues',
            true,
        );
    });

    test.each([
        {metric: 'State', override: {VDiskState: EVDiskState.Initial}},
        {
            metric: 'CapacityAlert',
            override: {CapacityAlert: ECapacityAlert.LIGHTYELLOW},
        },
        {metric: 'FrontQueues', override: {FrontQueues: EFlag.Yellow}},
        {
            metric: 'Fresh Compaction rank',
            override: {
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Yellow},
                    LevelRank: {Flag: EFlag.Green},
                },
            },
        },
        {
            metric: 'Level Compaction rank',
            override: {
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Green},
                    LevelRank: {Flag: EFlag.Red},
                },
            },
        },
    ])('marks a VDisk with non-green $metric data as having issues', ({override}) => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        mockUseSpaceLegendSelection.mockReturnValue(
            new Set([ECapacityAlert.GREEN, ECapacityAlert.LIGHTYELLOW]),
        );
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                ...ALL_GREEN_VDISK,
                ...override,
            }),
        ).toHaveProperty('allMode.hasIssues', true);
    });

    test('exposes an active Capacity Alert indicator in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
                CapacityAlert: ECapacityAlert.LIGHTYELLOW,
            }),
        ).toHaveProperty('allMode.indicators.capacityAlert', 'LY');
    });

    test('uses a question icon when Capacity Alert data is unavailable in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
            }),
        ).toHaveProperty('allMode.indicators.capacityAlert', CircleQuestionFill);
    });

    test('exposes a FrontQueues warning indicator in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
                FrontQueues: EFlag.Yellow,
            }),
        ).toHaveProperty('allMode.indicators.frontQueues', Ellipsis);
    });

    test('uses a question icon when FrontQueues data is unavailable in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
            }),
        ).toHaveProperty('allMode.indicators.frontQueues', CircleQuestionFill);
    });

    test('exposes Compaction rank indicators in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Green},
                    LevelRank: {Flag: EFlag.Red},
                },
            }),
        ).toHaveProperty('allMode.indicators.compaction', [
            {icon: CircleCheckFill, color: 'var(--g-color-text-positive)'},
            {icon: CircleXmarkFill, color: 'var(--g-color-text-primary)'},
        ]);
    });

    test('uses question icons when Compaction data is unavailable in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
            }),
        ).toHaveProperty('allMode.indicators.compaction', [
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
        ]);
    });

    test('does not expose an inactive Capacity Alert indicator in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        mockUseSpaceLegendSelection.mockReturnValue(new Set([ECapacityAlert.LIGHTYELLOW]));
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(
            result.current({
                VDiskId: {
                    GroupID: 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
                CapacityAlert: ECapacityAlert.LIGHTYELLOW,
            }),
        ).not.toHaveProperty('allMode.indicators.capacityAlert');
    });

    test('does not expose All-mode indicators outside Expert Mode All', () => {
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        const displayState = result.current({
            VDiskId: {
                GroupID: 1,
                GroupGeneration: 1,
                Ring: 0,
                Domain: 0,
                VDisk: 0,
            },
            CapacityAlert: ECapacityAlert.LIGHTYELLOW,
            FrontQueues: EFlag.Yellow,
            SatisfactionRank: {
                FreshRank: {Flag: EFlag.Green},
                LevelRank: {Flag: EFlag.Red},
            },
        });

        expect(displayState).not.toHaveProperty('allMode');
    });
});
