import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import type {PreparedVDisk} from '../../../utils/disks/types';
import {VDiskInfo} from '../VDiskInfo';

jest.mock('../../../routes', () => ({
    useVDiskPagePath: () => () => '/vdisk-page',
}));

jest.mock('../../../utils/developerUI/developerUI', () => ({
    useHasDeveloperUi: () => false,
}));

describe('VDiskInfo', () => {
    test('renders VDisk page link as an internal link', () => {
        render(
            <MemoryRouter>
                <VDiskInfo
                    data={{NodeId: 1, StringifiedId: '1-2-3-4-5'} as PreparedVDisk}
                    withVDiskPageLink
                />
            </MemoryRouter>,
        );

        const link = screen.getByRole('link', {name: /VDisk page/});

        expect(link).toHaveAttribute('href', '/vdisk-page');
        expect(link).not.toHaveAttribute('target', '_blank');
    });
});
