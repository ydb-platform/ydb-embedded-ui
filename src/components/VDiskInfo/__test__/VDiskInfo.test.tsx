import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import type {PreparedVDisk} from '../../../utils/disks/types';
import {VDiskInfo} from '../VDiskInfo';

jest.mock('../../../routes', () => ({
    getPDiskPagePath: (pDiskId: string | number, nodeId: string | number) =>
        `/pdisk-page?nodeId=${nodeId}&pDiskId=${pDiskId}`,
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
    test('renders PDisk id as an internal link when PDiskId and NodeId are defined', () => {
        render(
            <MemoryRouter>
                <VDiskInfo data={{NodeId: 1, PDiskId: 2} as PreparedVDisk} />
            </MemoryRouter>,
        );

        const link = screen.getByRole('link', {name: '2'});

        expect(link).toHaveAttribute('href', '/pdisk-page?nodeId=1&pDiskId=2');
    });
});
