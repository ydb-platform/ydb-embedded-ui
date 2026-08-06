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
    DiskStateProgressBar: ({
        icon,
        noDataPlaceholder,
        striped,
    }: {
        icon?: unknown;
        noDataPlaceholder?: React.ReactNode;
        striped?: boolean;
    }) => (
        <div
            data-testid="disk-progress"
            data-has-icon={icon ? 'true' : 'false'}
            data-no-data-placeholder={noDataPlaceholder}
            data-striped={striped ? 'true' : 'false'}
        />
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

        expect(screen.getByTestId('disk-progress')).toHaveAttribute(
            'data-no-data-placeholder',
            'N/D',
        );
    });

    test('does not mark no data vdisk as replicating in expert modes', () => {
        renderVDisk({
            data: {Replicated: false},
            getDisplayState: () => ({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                icon: undefined,
                modeModifier: 'mode-space',
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
                modeModifier: 'mode-state',
                showNoDataPlaceholder: true,
            }),
        });

        expect(screen.getByTestId('disk-progress')).toHaveAttribute(
            'data-no-data-placeholder',
            'N/D',
        );
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
                modeModifier: 'mode-state',
                showNoDataPlaceholder: false,
            }),
        });

        expect(screen.getByTestId('disk-progress')).not.toHaveAttribute('data-no-data-placeholder');
        expect(screen.getByTestId('disk-progress')).toHaveAttribute('data-has-icon', 'false');
    });

    test.each(['mode-space', 'mode-frontqueues', 'mode-compaction'])(
        'does not pass no data placeholder when %s renders status icon',
        (modeModifier) => {
            renderVDisk({
                data: {},
                getDisplayState: () => ({
                    severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                    icon: CircleQuestionFill,
                    modeModifier,
                }),
            });

            expect(screen.getByTestId('disk-progress')).toHaveAttribute('data-has-icon', 'true');
            expect(screen.getByTestId('disk-progress')).not.toHaveAttribute(
                'data-no-data-placeholder',
            );
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
                modeModifier: 'mode-all',
                allModeHasIssues: false,
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
                modeModifier: 'mode-all',
                allModeHasIssues: true,
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
                modeModifier: 'mode-all',
                allModeHasIssues: false,
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

    beforeEach(() => {
        mockUseIsStorageExpertMode.mockReturnValue(true);
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.State);
        mockUseSpaceLegendSelection.mockReturnValue(new Set());
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
            icon: undefined,
            modeModifier: 'mode-state',
            showNoDataPlaceholder: false,
        });
    });

    test('requests N/D without a Capacity Alert indicator when Whiteboard is unavailable', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        const displayState = result.current({});

        expect(displayState).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
            icon: undefined,
            modeModifier: 'mode-all',
            showNoDataPlaceholder: true,
        });
        expect(displayState).not.toHaveProperty('capacityAlertIndicator');
        expect(displayState).not.toHaveProperty('frontQueuesIndicator');
        expect(displayState).not.toHaveProperty('compactionIndicator');
        expect(displayState).not.toHaveProperty('allModeHasIssues');
    });

    test('uses a dedicated mode-all modifier for Expert Mode All', () => {
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
            }),
        ).toMatchObject({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
            modeModifier: 'mode-all',
            showNoDataPlaceholder: false,
        });
    });

    test('keeps an all-green VDisk healthy regardless of inactive legend selectors', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        mockUseSpaceLegendSelection.mockReturnValue(new Set([ECapacityAlert.GREEN]));
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(result.current(ALL_GREEN_VDISK)).toHaveProperty('allModeHasIssues', false);
    });

    test('treats Blue FrontQueues as an issue in Expert Mode All', () => {
        mockUseVDisksGroupByParam.mockReturnValue(VDisksGroupBy.All);
        const {result} = renderHook(() => useStorageVDiskDisplayStateGetter());

        expect(result.current({...ALL_GREEN_VDISK, FrontQueues: EFlag.Blue})).toHaveProperty(
            'allModeHasIssues',
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
        ).toHaveProperty('allModeHasIssues', true);
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
        ).toHaveProperty('capacityAlertIndicator', 'LY');
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
        ).toHaveProperty('capacityAlertIndicator', CircleQuestionFill);
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
        ).toHaveProperty('frontQueuesIndicator', Ellipsis);
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
        ).toHaveProperty('frontQueuesIndicator', CircleQuestionFill);
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
        ).toHaveProperty('compactionIndicator', [
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
        ).toHaveProperty('compactionIndicator', [
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
        ).not.toHaveProperty('capacityAlertIndicator');
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

        expect(displayState).not.toHaveProperty('capacityAlertIndicator');
        expect(displayState).not.toHaveProperty('frontQueuesIndicator');
        expect(displayState).not.toHaveProperty('compactionIndicator');
        expect(displayState).not.toHaveProperty('allModeHasIssues');
    });
});
