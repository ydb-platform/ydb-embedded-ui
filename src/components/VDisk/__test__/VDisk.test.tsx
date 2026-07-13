import React from 'react';

import {CircleQuestionFill} from '@gravity-ui/icons';
import {render, screen} from '@testing-library/react';

import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../../../utils/disks/constants';
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
                })}
            />,
        );

        expect(screen.getByTestId('disk-progress')).toHaveAttribute(
            'data-no-data-placeholder',
            'N/D',
        );
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
