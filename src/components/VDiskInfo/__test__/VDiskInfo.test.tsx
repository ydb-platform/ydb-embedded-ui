import React from 'react';

import {render, screen} from '@testing-library/react';

import type {PreparedVDisk} from '../../../utils/disks/types';
import {VDiskInfo} from '../VDiskInfo';

jest.mock('../../../routes', () => ({
    useVDiskPagePath: () => () => '/vdisk-page',
}));

jest.mock('../../../utils/developerUI/developerUI', () => ({
    useHasDeveloperUi: () => false,
}));

describe('VDiskInfo', () => {
    test('opens VDisk page link in a new tab', () => {
        render(
            <React.Fragment>
                <VDiskInfo
                    data={{NodeId: 1, StringifiedId: '1-2-3-4-5'} as PreparedVDisk}
                    withVDiskPageLink
                />
            </React.Fragment>,
        );

        const link = screen.getByRole('link', {name: /VDisk page/});

        expect(link).toHaveAttribute('href', '/vdisk-page');
        expect(link).toHaveAttribute('target', '_blank');
    });
});
