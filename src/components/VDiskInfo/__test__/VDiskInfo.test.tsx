import {screen, waitFor} from '@testing-library/react';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {configureStore} from '../../../store';
import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {renderWithStore} from '../../../utils/tests/providers';
import {VDiskInfo} from '../VDiskInfo';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    ...jest.requireActual('../../../store/reducers/capabilities/hooks'),
    useBlobStorageCapacityMetricsEnabled: jest.fn(),
}));

const {useBlobStorageCapacityMetricsEnabled} = jest.requireMock(
    '../../../store/reducers/capabilities/hooks',
);

const capacityMetricsData: PreparedVDisk = {
    AllocatedSize: 1_000_000_000,
    SizeLimit: 2_000_000_000,
    AllocatedPercent: 50,
    DiskSpace: EFlag.Green,
    VDiskSlotUsage: 82.25,
    VDiskRawUsage: 64.5,
    GroupSizeInUnits: 2,
    CapacityAlert: ECapacityAlert.LIGHTYELLOW,
};

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
    beforeEach(() => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
    });

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

    test('renders explicit VDisk capacity metrics when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderWithWhoami({data: capacityMetricsData});

        expect(screen.getByText('VDisk Slot Usage')).toBeVisible();
        expect(screen.getByText('VDisk Raw Usage')).toBeVisible();
        expect(screen.getByText('Group Size In Units')).toBeVisible();
        expect(screen.getByText('LIGHT_YELLOW')).toBeVisible();
        expect(screen.queryByText('Usage', {exact: true})).not.toBeInTheDocument();
        expect(screen.queryByText('Disk Space', {exact: true})).not.toBeInTheDocument();
    });

    test('keeps legacy capacity rows when explicit VDisk capacity metrics are disabled', () => {
        renderWithWhoami({data: capacityMetricsData});

        expect(screen.getByText('Usage')).toBeVisible();
        expect(screen.getByText('Disk Space')).toBeVisible();
        expect(screen.queryByText('VDisk Slot Usage')).not.toBeInTheDocument();
        expect(screen.queryByText('VDisk Raw Usage')).not.toBeInTheDocument();
        expect(screen.queryByText('Group Size In Units')).not.toBeInTheDocument();
        expect(screen.queryByText('Capacity Alert')).not.toBeInTheDocument();
    });

    test('keeps every explicit VDisk capacity row visible when metric fields are absent', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderWithWhoami({data: {}} as {data: PreparedVDisk});

        expect(screen.getByText('Size')).toBeVisible();
        expect(screen.getByText('VDisk Slot Usage')).toBeVisible();
        expect(screen.getByText('VDisk Raw Usage')).toBeVisible();
        expect(screen.getByText('Group Size In Units')).toBeVisible();
        expect(screen.getByText('Capacity Alert')).toBeVisible();
        expect(screen.getAllByText(EMPTY_DATA_PLACEHOLDER)).toHaveLength(5);
    });
});
