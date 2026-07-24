import {ThemeProvider} from '@gravity-ui/uikit';
import {screen, within} from '@testing-library/react';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {configureStore} from '../../../store';
import {ECapacityAlert} from '../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import type {PreparedPDisk} from '../../../utils/disks/types';
import {renderWithStore} from '../../../utils/tests/providers';
import {PDiskInfo} from '../PDiskInfo';

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

function renderPDiskInfo(data: PreparedPDisk) {
    const storeConfiguration = configureStore({
        api: {viewer: {whoami: jest.fn().mockResolvedValue({})}} as never,
    });

    renderWithStore(
        <Router history={storeConfiguration.history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <ThemeProvider theme="light">
                    <PDiskInfo pDisk={data} />
                </ThemeProvider>
            </QueryParamProvider>
        </Router>,
        {storeConfiguration},
    );
}

function getInfoViewerRow(label: string) {
    const row = screen.getByText(label).closest('.info-viewer__row');

    if (!(row instanceof HTMLElement)) {
        throw new Error(`Info-viewer row was not found for ${label}`);
    }

    return row;
}

describe('PDiskInfo', () => {
    beforeEach(() => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
    });

    test('renders explicit PDisk capacity metrics when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderPDiskInfo(pDisk);

        expect(screen.getByText('Space')).toBeVisible();
        expect(screen.getByText('20 / 100 GB')).toBeVisible();
        expect(screen.getByText('PDisk Usage')).toBeVisible();
        expect(screen.getByText('70.5%')).toBeVisible();
        expect(screen.getByText('Slots')).toBeVisible();
        expect(screen.getByText('0 / 4')).toBeVisible();
        expect(screen.getByText('Slot Size In Units')).toBeVisible();
        expect(screen.getByText('2')).toBeVisible();
        expect(screen.queryByText('Usage', {exact: true})).not.toBeInTheDocument();
    });

    test('keeps legacy capacity rows when explicit PDisk capacity metrics are disabled', () => {
        renderPDiskInfo(pDisk);

        expect(screen.getByText('Space')).toBeVisible();
        expect(screen.getByText('Usage')).toBeVisible();
        expect(screen.getByText('20%')).toBeVisible();
        expect(screen.getByText('Slots')).toBeVisible();
        expect(screen.getByText('0 / 4')).toBeVisible();
        expect(screen.queryByText('PDisk Usage')).not.toBeInTheDocument();
        expect(screen.queryByText('Slot Size In Units')).not.toBeInTheDocument();
    });

    test('keeps every explicit PDisk capacity row visible when metric fields are absent', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderPDiskInfo({});

        for (const label of ['Space', 'PDisk Usage', 'Slots', 'Slot Size In Units']) {
            expect(within(getInfoViewerRow(label)).getByText(EMPTY_DATA_PLACEHOLDER)).toBeVisible();
        }
    });
});
