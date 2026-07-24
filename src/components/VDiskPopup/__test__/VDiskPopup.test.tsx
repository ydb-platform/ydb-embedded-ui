import {screen} from '@testing-library/react';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {configureStore} from '../../../store';
import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {renderWithStore} from '../../../utils/tests/providers';
import {VDiskPopup} from '../VDiskPopup';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    ...jest.requireActual('../../../store/reducers/capabilities/hooks'),
    useBlobStorageCapacityMetricsEnabled: jest.fn(),
}));

const {useBlobStorageCapacityMetricsEnabled} = jest.requireMock(
    '../../../store/reducers/capabilities/hooks',
);

const capacityMetricsData: PreparedVDisk = {
    VDiskId: {},
    AllocatedSize: 1_000_000_000,
    SizeLimit: 2_000_000_000,
    AllocatedPercent: 50,
    DiskSpace: EFlag.Green,
    VDiskSlotUsage: 82.25,
    VDiskRawUsage: 64.5,
    GroupSizeInUnits: 2,
    CapacityAlert: ECapacityAlert.LIGHTYELLOW,
};

function renderVDiskPopup(data: PreparedVDisk) {
    const storeConfiguration = configureStore({
        api: {viewer: {whoami: jest.fn().mockResolvedValue({IsViewerAllowed: false})}} as never,
    });

    renderWithStore(
        <Router history={storeConfiguration.history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <VDiskPopup data={data} />
            </QueryParamProvider>
        </Router>,
        {storeConfiguration},
    );
}

describe('VDiskPopup', () => {
    beforeEach(() => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
    });

    test('renders compact explicit VDisk capacity metrics when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderVDiskPopup(capacityMetricsData);

        expect(screen.queryByText('Allocated', {exact: true})).not.toBeInTheDocument();
        expect(screen.queryByText('Available', {exact: true})).not.toBeInTheDocument();
        expect(screen.getByText('Size')).toBeVisible();
        expect(screen.getByText('1 / 2 GB')).toBeVisible();
        expect(screen.getByText('VDisk Slot Usage')).toBeVisible();
        expect(screen.getByText('82.3%')).toBeVisible();
        expect(screen.queryByText('VDisk Raw Usage')).not.toBeInTheDocument();
        expect(screen.getByText('Group Size In Units')).toBeVisible();
        expect(screen.getByText('Capacity Alert')).toBeVisible();
        expect(screen.getByText('LIGHT_YELLOW')).toBeVisible();
    });
});
