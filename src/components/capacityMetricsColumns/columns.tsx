import DataTable from '@gravity-ui/react-data-table';
import {isNil} from 'lodash';

import {EMPTY_DATA_PLACEHOLDER} from '../../lib';
import {cn} from '../../utils/cn';
import {formatPercent} from '../../utils/dataFormatters/dataFormatters';
import type {Column} from '../../utils/tableUtils/types';
import {isNumeric} from '../../utils/utils';

import {CAPACITY_METRICS_COLUMN_IDS, CAPACITY_METRICS_COLUMN_TITLES} from './constants';

import './CapacityMetricsColumns.scss';

const b = cn('ydb-capacity-metrics-columns');

export function getPDiskUsageColumn<T extends {MaxPDiskUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxPDiskUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.MaxPDiskUsage,
        width: 150,
        render: ({row}) => {
            return isNumeric(row.MaxPDiskUsage)
                ? formatPercent(row.MaxPDiskUsage, 4)
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.CENTER,
    };
}

export function getVDiskSlotUsageColumn<T extends {MaxVDiskSlotUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxVDiskSlotUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
        width: 200,
        render: ({row}) => {
            return isNumeric(row.MaxVDiskSlotUsage)
                ? formatPercent(row.MaxVDiskSlotUsage, 4)
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.CENTER,
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

            const capacityClassName = row.CapacityAlert.toLocaleLowerCase();

            return <span className={b(capacityClassName)}>{row.CapacityAlert}</span>;
        },
        align: DataTable.CENTER,
    };
}

export function getVDiskRawUsageColumn<T extends {MaxVDiskRawUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxVDiskRawUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
        width: 200,
        render: ({row}) => {
            return isNumeric(row.MaxVDiskRawUsage)
                ? formatPercent(row.MaxVDiskRawUsage, 4)
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.CENTER,
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
                ? formatPercent(row.MaxNormalizedOccupancy, 4)
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.CENTER,
    };
}
