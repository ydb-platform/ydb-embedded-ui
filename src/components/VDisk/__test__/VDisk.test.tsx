import React from 'react';

import {CircleQuestionFill} from '@gravity-ui/icons';
import {render, renderHook, screen} from '@testing-library/react';

import {useStorageVDiskDisplayStateGetter} from '../../../containers/Storage/useStorageVDiskDisplayStateGetter';
import {ECapacityAlert} from '../../../types/api/enums';
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

jest.mock('../../InternalLink', () => ({
    InternalLink: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
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

describe('VDisk', () => {
    beforeEach(() => {
        mockUseIsStorageExpertMode.mockReset();
        mockUseVDisksGroupByParam.mockReset();
        mockUseSpaceLegendSelection.mockReset();
    });

    test('does not subscribe to Storage state in default mode', () => {
        render(<VDisk data={{}} />);

        expect(mockUseIsStorageExpertMode).not.toHaveBeenCalled();
        expect(mockUseVDisksGroupByParam).not.toHaveBeenCalled();
        expect(mockUseSpaceLegendSelection).not.toHaveBeenCalled();
    });

    test('keeps N/D fallback in default mode', () => {
        render(<VDisk data={{}} />);

        expect(screen.getByTestId('disk-progress')).toHaveAttribute(
            'data-no-data-placeholder',
            'N/D',
        );
    });

    test('does not mark no data vdisk as replicating in expert modes', () => {
        render(
            <VDisk
                data={{Replicated: false}}
                getDisplayState={() => ({
                    severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                    icon: undefined,
                    modeModifier: 'mode-space',
                })}
            />,
        );

        expect(screen.getByTestId('disk-progress')).toHaveAttribute('data-striped', 'false');
    });

    test('uses N/D as no data placeholder', () => {
        render(
            <VDisk
                data={{}}
                getDisplayState={() => ({
                    severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                    icon: undefined,
                    modeModifier: 'mode-state',
                    showNoDataPlaceholder: true,
                })}
            />,
        );

        expect(screen.getByTestId('disk-progress')).toHaveAttribute(
            'data-no-data-placeholder',
            'N/D',
        );
    });

    test('does not use N/D when only State data is unavailable in expert mode', () => {
        render(
            <VDisk
                data={{
                    VDiskId: {
                        GroupID: 1,
                        GroupGeneration: 1,
                        Ring: 0,
                        Domain: 0,
                        VDisk: 0,
                    },
                }}
                getDisplayState={() => ({
                    severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                    icon: undefined,
                    modeModifier: 'mode-state',
                    showNoDataPlaceholder: false,
                })}
            />,
        );

        expect(screen.getByTestId('disk-progress')).not.toHaveAttribute('data-no-data-placeholder');
        expect(screen.getByTestId('disk-progress')).toHaveAttribute('data-has-icon', 'false');
    });

    test.each(['mode-space', 'mode-frontqueues', 'mode-compaction'])(
        'does not pass no data placeholder when %s renders status icon',
        (modeModifier) => {
            render(
                <VDisk
                    data={{}}
                    getDisplayState={() => ({
                        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                        icon: CircleQuestionFill,
                        modeModifier,
                    })}
                />,
            );

            expect(screen.getByTestId('disk-progress')).toHaveAttribute('data-has-icon', 'true');
            expect(screen.getByTestId('disk-progress')).not.toHaveAttribute(
                'data-no-data-placeholder',
            );
        },
    );
});

describe('useStorageVDiskDisplayStateGetter', () => {
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

    test('does not expose a Capacity Alert indicator outside Expert Mode All', () => {
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
});
