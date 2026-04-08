import DataTable from '@gravity-ui/react-data-table';
import {Label} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import type {ECapacityAlert} from '../../types/api/enums';
import {getCapacityAlertTheme} from '../../utils/capacityAlerts';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatPercent} from '../../utils/dataFormatters/dataFormatters';
import type {Column} from '../../utils/tableUtils/types';
import {isNumeric} from '../../utils/utils';

import {CAPACITY_METRICS_COLUMN_IDS, CAPACITY_METRICS_COLUMN_TITLES} from './constants';

export function getPDiskUsageColumn<T extends {MaxPDiskUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxPDiskUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.MaxPDiskUsage,
        width: 150,
        render: ({row}) => {
            return isNumeric(row.MaxPDiskUsage)
                ? formatPercent(row.MaxPDiskUsage, 2, {fixed: true})
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.RIGHT,
    };
}

export function getVDiskSlotUsageColumn<
    T extends {MaxVDiskSlotUsage?: number; CapacityAlert?: ECapacityAlert},
>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxVDiskSlotUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
        width: 180,
        render: ({row}) => {
            const theme = getCapacityAlertTheme(row.CapacityAlert);

            return isNumeric(row.MaxVDiskSlotUsage) ? (
                <Label theme={theme}>
                    {formatPercent(row.MaxVDiskSlotUsage, 2, {fixed: true})}
                </Label>
            ) : (
                EMPTY_DATA_PLACEHOLDER
            );
        },
        align: DataTable.RIGHT,
    };
}

export function getCapacityAlertColumn<T extends {CapacityAlert?: ECapacityAlert}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.CapacityAlert,
        header: CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert,
        width: 150,
        render: ({row}) => {
            if (isNil(row.CapacityAlert)) {
                return EMPTY_DATA_PLACEHOLDER;
            }

            return row.CapacityAlert;
        },
        align: DataTable.CENTER,
    };
}

export function getVDiskRawUsageColumn<T extends {MaxVDiskRawUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxVDiskRawUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
        width: 180,
        render: ({row}) => {
            return isNumeric(row.MaxVDiskRawUsage)
                ? formatPercent(row.MaxVDiskRawUsage, 2, {fixed: true})
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.RIGHT,
    };
}

export function getNormalizedOccupancyColumn<
    T extends {MaxNormalizedOccupancy?: number},
>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxNormalizedOccupancy,
        header: CAPACITY_METRICS_COLUMN_TITLES.MaxNormalizedOccupancy,
        width: 200,
        render: ({row}) => {
            return isNumeric(row.MaxNormalizedOccupancy)
                ? Number(row.MaxNormalizedOccupancy).toFixed(2)
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.RIGHT,
    };
}
