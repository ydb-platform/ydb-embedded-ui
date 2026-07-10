import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import type {PreparedVDisk} from '../../../utils/disks/types';
import {useIsViewerUser} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {VDiskInfo} from '../VDiskInfo';

jest.mock('../../../routes', () => ({
    getPDiskPagePath: (pDiskId: string | number, nodeId: string | number) =>
        `/pdisk-page?nodeId=${nodeId}&pDiskId=${pDiskId}`,
    useVDiskPagePath: () => () => '/vdisk-page',
}));

jest.mock('../../../utils/developerUI/developerUI', () => ({
    useHasDeveloperUi: () => false,
}));

jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: jest.fn(),
}));

describe('VDiskInfo', () => {
    beforeEach(() => {
        (useIsViewerUser as jest.Mock).mockReturnValue(true);
    });

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

    test('renders PDisk id as plain text for non-viewer users', () => {
        (useIsViewerUser as jest.Mock).mockReturnValue(false);

        render(
            <MemoryRouter>
                <VDiskInfo data={{NodeId: 1, PDiskId: 2} as PreparedVDisk} />
            </MemoryRouter>,
        );

        expect(screen.getByText('2')).toBeVisible();
        expect(screen.queryByRole('link', {name: '2'})).not.toBeInTheDocument();
    });
});
