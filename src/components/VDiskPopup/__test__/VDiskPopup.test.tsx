import {screen, within} from '@testing-library/react';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {configureStore} from '../../../store';
import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
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
    AvailableSize: 1_000_000_000,
    SizeLimit: 2_000_000_000,
    AllocatedPercent: 50,
    DiskSpace: EFlag.Green,
    VDiskSlotUsage: 82.25,
    VDiskRawUsage: 64.5,
    GroupSizeInUnits: 2,
    CapacityAlert: ECapacityAlert.LIGHTYELLOW,
};

const pDisk: PreparedPDisk = {
    AllocatedSize: 20_000_000_000,
    TotalSize: 100_000_000_000,
    AllocatedPercent: 20,
    NumActiveSlots: 0,
    ExpectedSlotCount: 4,
    SlotSizeInUnits: 2,
    PDiskUsage: 70.5,
    PDiskCapacityAlert: ECapacityAlert.ORANGE,
};

function renderVDiskPopup(data: PreparedVDisk, isViewerAllowed = false) {
    const storeConfiguration = configureStore({
        api: {
            viewer: {whoami: jest.fn().mockResolvedValue({IsViewerAllowed: isViewerAllowed})},
        } as never,
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

function getDefinitionListRow(label: string) {
    const row = screen.getByText(label).closest('.g-definition-list__item');

    if (!(row instanceof HTMLElement)) {
        throw new Error(`Definition-list row was not found for ${label}`);
    }

    return row;
}

describe('VDiskPopup', () => {
    beforeEach(() => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
    });

    test('renders compact explicit VDisk capacity metrics when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderVDiskPopup(capacityMetricsData);

        expect(screen.queryByText('Space', {exact: true})).not.toBeInTheDocument();
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

    test('keeps legacy space and allocation rows when explicit VDisk capacity metrics are disabled', () => {
        renderVDiskPopup(capacityMetricsData);

        expect(screen.getByText('Space')).toBeVisible();
        expect(screen.getByText('Allocated')).toBeVisible();
        expect(screen.getByText('Available')).toBeVisible();
        expect(screen.queryByText('Size', {exact: true})).not.toBeInTheDocument();
        expect(screen.queryByText('VDisk Slot Usage')).not.toBeInTheDocument();
        expect(screen.queryByText('Group Size In Units')).not.toBeInTheDocument();
        expect(screen.queryByText('Capacity Alert')).not.toBeInTheDocument();
    });

    test('keeps compact explicit VDisk capacity rows visible when metric fields are absent', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderVDiskPopup({VDiskId: {}});

        for (const label of ['Size', 'VDisk Slot Usage', 'Group Size In Units', 'Capacity Alert']) {
            expect(
                within(getDefinitionListRow(label)).getByText(EMPTY_DATA_PLACEHOLDER),
            ).toBeVisible();
        }
    });

    test('renders the same explicit PDisk capacity rows in the nested PDisk section', async () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderVDiskPopup({...capacityMetricsData, PDisk: pDisk}, true);

        const pdiskTitle = await screen.findByText('PDisk');
        const pdiskSection = pdiskTitle.closest('.ydb-definition-list');

        if (!(pdiskSection instanceof HTMLElement)) {
            throw new Error('Nested PDisk definition list was not found');
        }

        expect(within(pdiskSection).getByText('Space')).toBeVisible();
        expect(within(pdiskSection).getByText('20 / 100 GB')).toBeVisible();
        expect(within(pdiskSection).getByText('Slots')).toBeVisible();
        expect(within(pdiskSection).getByText('0 / 4')).toBeVisible();
        expect(within(pdiskSection).getByText('Slot Size In Units')).toBeVisible();
        expect(within(pdiskSection).getByText('2')).toBeVisible();
        expect(within(pdiskSection).getByText('Capacity Alert')).toBeVisible();
        expect(within(pdiskSection).getByText('ORANGE')).toBeVisible();
        expect(
            within(pdiskSection).queryByText('Available', {exact: true}),
        ).not.toBeInTheDocument();
    });
});
