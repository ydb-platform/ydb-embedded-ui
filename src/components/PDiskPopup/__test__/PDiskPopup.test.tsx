import {screen, within} from '@testing-library/react';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {configureStore} from '../../../store';
import {ECapacityAlert} from '../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import type {PreparedPDisk} from '../../../utils/disks/types';
import {renderWithStore} from '../../../utils/tests/providers';
import {PDiskPopup} from '../PDiskPopup';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    ...jest.requireActual('../../../store/reducers/capabilities/hooks'),
    useBlobStorageCapacityMetricsEnabled: jest.fn(),
}));

const {useBlobStorageCapacityMetricsEnabled} = jest.requireMock(
    '../../../store/reducers/capabilities/hooks',
);

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

function renderPDiskPopup(data: PreparedPDisk) {
    const storeConfiguration = configureStore({
        api: {viewer: {whoami: jest.fn().mockResolvedValue({})}} as never,
    });

    renderWithStore(
        <Router history={storeConfiguration.history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <PDiskPopup data={data} />
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

describe('PDiskPopup', () => {
    beforeEach(() => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
    });

    test('renders compact explicit PDisk capacity metrics when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderPDiskPopup(pDisk);

        expect(screen.getByText('Space')).toBeVisible();
        expect(screen.getByText('20 / 100 GB')).toBeVisible();
        expect(screen.getByText('Slots')).toBeVisible();
        expect(screen.getByText('0 / 4')).toBeVisible();
        expect(screen.getByText('Slot Size In Units')).toBeVisible();
        expect(screen.getByText('2')).toBeVisible();
        expect(screen.getByText('Capacity Alert')).toBeVisible();
        expect(screen.getByText('ORANGE')).toBeVisible();
        expect(screen.queryByText('Available', {exact: true})).not.toBeInTheDocument();
    });

    test('keeps legacy available row when explicit PDisk capacity metrics are disabled', () => {
        renderPDiskPopup({...pDisk, AvailableSize: 80_000_000_000});

        expect(screen.getByText('Available')).toBeVisible();
        expect(screen.getByText('80.0 GB of 100 GB')).toBeVisible();
        expect(screen.queryByText('Space', {exact: true})).not.toBeInTheDocument();
        expect(screen.queryByText('Slots')).not.toBeInTheDocument();
        expect(screen.queryByText('Slot Size In Units')).not.toBeInTheDocument();
        expect(screen.queryByText('Capacity Alert')).not.toBeInTheDocument();
    });

    test('keeps every explicit PDisk capacity row visible when metric fields are absent', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderPDiskPopup({});

        for (const label of ['Space', 'Slots', 'Slot Size In Units', 'Capacity Alert']) {
            expect(
                within(getDefinitionListRow(label)).getByText(EMPTY_DATA_PLACEHOLDER),
            ).toBeVisible();
        }
    });
});
