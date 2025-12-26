import DataTable from '@gravity-ui/react-data-table';
import {isNil} from 'lodash';

import {EMPTY_DATA_PLACEHOLDER} from '../../lib';
import {getCapacityAlertColor} from '../../utils/capacityAlert/colors';
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

export function getVDiskSlotUsageColumn<T extends {MaxVDiskSlotUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxVDiskSlotUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
        width: 180,
        render: ({row}) => {
            return isNumeric(row.MaxVDiskSlotUsage)
                ? formatPercent(row.MaxVDiskSlotUsage, 2, {fixed: true})
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.RIGHT,
    };
}

export function getCapacityAlertColumn<T extends {CapacityAlert?: string}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.CapacityAlert,
        header: CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert,
        width: 150,
        render: ({row}) => {
            if (isNil(row.CapacityAlert)) {
                return EMPTY_DATA_PLACEHOLDER;
            }

            const color = getCapacityAlertColor(row.CapacityAlert);

            return <span style={color ? {color} : undefined}>{row.CapacityAlert}</span>;
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
