import React from 'react';

import {CircleQuestionFill} from '@gravity-ui/icons';
import {render, screen} from '@testing-library/react';

import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../../../utils/disks/constants';
import type {DiskDisplayState, useDiskDisplayState} from '../../../utils/disks/useDiskDisplayState';
import {VDisk} from '../VDisk';

const mockUseDiskDisplayState = jest.fn<DiskDisplayState, Parameters<typeof useDiskDisplayState>>();

jest.mock('../../../routes', () => ({
    useVDiskPagePath: () => () => '/vdisk',
}));

jest.mock('../../../utils/disks/useDiskDisplayState', () => ({
    useDiskDisplayState: (...args: Parameters<typeof useDiskDisplayState>) =>
        mockUseDiskDisplayState(...args),
}));

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
        mockUseDiskDisplayState.mockReset();
    });

    test('does not mark no data vdisk as replicating in expert modes', () => {
        mockUseDiskDisplayState.mockReturnValue({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
            icon: undefined,
            modeModifier: 'mode-space',
        });

        render(<VDisk data={{Replicated: false}} withExpertMode />);

        expect(screen.getByTestId('disk-progress')).toHaveAttribute('data-striped', 'false');
    });

    test('uses N/D as no data placeholder', () => {
        mockUseDiskDisplayState.mockReturnValue({
            severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
            icon: undefined,
            modeModifier: 'mode-state',
        });

        render(<VDisk data={{}} withExpertMode />);

        expect(screen.getByTestId('disk-progress')).toHaveAttribute(
            'data-no-data-placeholder',
            'N/D',
        );
    });

    test.each(['mode-space', 'mode-frontqueues', 'mode-compaction'])(
        'does not pass no data placeholder when %s renders status icon',
        (modeModifier) => {
            mockUseDiskDisplayState.mockReturnValue({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                icon: CircleQuestionFill,
                modeModifier,
            });

            render(<VDisk data={{}} withExpertMode />);

            expect(screen.getByTestId('disk-progress')).toHaveAttribute('data-has-icon', 'true');
            expect(screen.getByTestId('disk-progress')).not.toHaveAttribute(
                'data-no-data-placeholder',
            );
        },
    );
});
