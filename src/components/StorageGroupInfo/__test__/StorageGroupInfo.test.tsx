import {screen, within} from '@testing-library/react';

import type {PreparedStorageGroup} from '../../../store/reducers/storage/types';
import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {renderWithStore} from '../../../utils/tests/providers';
import {StorageGroupInfo} from '../StorageGroupInfo';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    ...jest.requireActual('../../../store/reducers/capabilities/hooks'),
    useBlobStorageCapacityMetricsEnabled: jest.fn(),
}));

const {useBlobStorageCapacityMetricsEnabled} = jest.requireMock(
    '../../../store/reducers/capabilities/hooks',
);

const group: PreparedStorageGroup = {
    GroupId: '1',
    GroupGeneration: '3',
    ErasureSpecies: 'mirror-3-dc',
    MediaType: 'SSD',
    Encryption: true,
    AllocationUnits: 7,
    GroupSizeInUnits: 0,
    Overall: EFlag.Green,
    State: 'ok',
    MissingDisks: 0,
    Used: 1_000_000_000,
    Limit: 2_000_000_000,
    Read: 0,
    Write: 0,
    DiskSpace: EFlag.Green,
    Usage: 50,
    Degraded: 0,
    MaxVDiskSlotUsage: 0.8225,
    MaxVDiskRawUsage: 0.645,
    CapacityAlert: ECapacityAlert.LIGHTYELLOW,
};

function renderStorageGroupInfo(data: PreparedStorageGroup) {
    renderWithStore(<StorageGroupInfo data={data} />);
}

function getInfoViewerRow(label: string) {
    const row = screen.getByText(label).closest('.info-viewer__row');

    if (!(row instanceof HTMLElement)) {
        throw new Error(`Info-viewer row was not found for ${label}`);
    }

    return row;
}

describe('StorageGroupInfo', () => {
    beforeEach(() => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(false);
    });

    test('renders explicit group configuration and runtime capacity metrics when enabled', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderStorageGroupInfo(group);

        expect(screen.getByText('Group Generation')).toBeVisible();
        expect(screen.getByText('Erasure Species')).toBeVisible();
        expect(screen.getByText('Media Type')).toBeVisible();
        expect(screen.getByText('Encryption')).toBeVisible();
        expect(screen.getByText('Units')).toBeVisible();
        expect(screen.getByText('Group Size In Units')).toBeVisible();
        expect(within(getInfoViewerRow('Units')).getByText('7')).toBeVisible();
        expect(within(getInfoViewerRow('Group Size In Units')).getByText('0')).toBeVisible();
        expect(screen.getByText('VDisk Slot Usage')).toBeVisible();
        expect(screen.getByText('VDisk Raw Usage')).toBeVisible();
        expect(screen.getByText('Capacity Alert')).toBeVisible();
        expect(screen.getByText('LIGHT_YELLOW')).toBeVisible();
        expect(screen.queryByText('Usage', {exact: true})).not.toBeInTheDocument();
        expect(screen.queryByText('Disk Space', {exact: true})).not.toBeInTheDocument();
    });

    test('keeps legacy group capacity rows when explicit capacity metrics are disabled', () => {
        renderStorageGroupInfo(group);

        expect(screen.getByText('Usage')).toBeVisible();
        expect(screen.getByText('Disk Space')).toBeVisible();
        expect(screen.queryByText('VDisk Slot Usage')).not.toBeInTheDocument();
        expect(screen.queryByText('VDisk Raw Usage')).not.toBeInTheDocument();
        expect(screen.queryByText('Group Size In Units')).not.toBeInTheDocument();
        expect(screen.queryByText('Capacity Alert')).not.toBeInTheDocument();
    });

    test('renders placeholders instead of zero for missing explicit group metrics', () => {
        useBlobStorageCapacityMetricsEnabled.mockReturnValue(true);

        renderStorageGroupInfo({} as PreparedStorageGroup);

        for (const label of [
            'Group Size In Units',
            'VDisk Slot Usage',
            'VDisk Raw Usage',
            'Capacity Alert',
        ]) {
            expect(within(getInfoViewerRow(label)).getByText(EMPTY_DATA_PLACEHOLDER)).toBeVisible();
        }
    });
});
