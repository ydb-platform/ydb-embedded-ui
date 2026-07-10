import {screen, waitFor} from '@testing-library/react';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {configureStore} from '../../../store';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {renderWithStore} from '../../../utils/tests/providers';
import {VDiskInfo} from '../VDiskInfo';

function renderWithWhoami({
    data,
    isViewerAllowed = true,
    withVDiskPageLink,
}: {
    data: PreparedVDisk;
    isViewerAllowed?: boolean;
    withVDiskPageLink?: boolean;
}) {
    const whoami = jest.fn().mockResolvedValue({IsViewerAllowed: isViewerAllowed});
    const api = {
        viewer: {
            whoami,
        },
    };

    const storeConfiguration = configureStore({api: api as never});

    renderWithStore(
        <Router history={storeConfiguration.history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <VDiskInfo data={data} withVDiskPageLink={withVDiskPageLink} />
            </QueryParamProvider>
        </Router>,
        {storeConfiguration},
    );

    return {whoami};
}

describe('VDiskInfo', () => {
    test('renders VDisk page link as an internal link', () => {
        renderWithWhoami({
            data: {NodeId: 1, StringifiedId: '1-2-3-4-5'} as PreparedVDisk,
            withVDiskPageLink: true,
        });

        const link = screen.getByRole('link', {name: /VDisk page/});

        expect(link).toHaveAttribute('href', '/vDisk?nodeId=1&vDiskId=1-2-3-4-5');
        expect(link).not.toHaveAttribute('target', '_blank');
    });

    test('renders PDisk id as an internal link when whoami allows viewer access', async () => {
        const {whoami} = renderWithWhoami({
            data: {NodeId: 1, PDiskId: 2} as PreparedVDisk,
            isViewerAllowed: true,
        });

        const link = await screen.findByRole('link', {name: '2'});

        expect(whoami).toHaveBeenCalledWith({database: undefined});
        expect(link).toHaveAttribute('href', '/pDisk?nodeId=1&pDiskId=2');
    });

    test('renders PDisk id as plain text when whoami denies viewer access', async () => {
        const {whoami} = renderWithWhoami({
            data: {NodeId: 1, PDiskId: 2} as PreparedVDisk,
            isViewerAllowed: false,
        });

        await waitFor(() => expect(whoami).toHaveBeenCalledWith({database: undefined}));

        expect(screen.getByText('2')).toBeVisible();
        expect(screen.queryByRole('link', {name: '2'})).not.toBeInTheDocument();
    });
});
