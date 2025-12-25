import DataTable from '@gravity-ui/react-data-table';
import {isNil} from 'lodash';

import {EMPTY_DATA_PLACEHOLDER} from '../../lib';
import {cn} from '../../utils/cn';
import {roundToPrecision} from '../../utils/dataFormatters/dataFormatters';
import type {Column} from '../../utils/tableUtils/types';
import {isNumeric} from '../../utils/utils';

import {CAPACITY_METRICS_COLUMN_IDS, CAPACITY_METRICS_COLUMN_TITLES} from './constants';

import './CapacityMetricsColumns.scss';

const b = cn('ydb-capacity-metrics-columns');

export function getPDiskUsageColumn<T extends {MaxPDiskUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.PDiskUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.PDiskUsage,
        width: 150,
        render: ({row}) => {
            return isNumeric(row.MaxPDiskUsage)
                ? roundToPrecision(row.MaxPDiskUsage, 4)
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.CENTER,
    };
}

export function getVDiskSlotUsageColumn<T extends {MaxVDiskSlotUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.VDiskSlotUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.VDiskSlotUsage,
        width: 150,
        render: ({row}) => {
            return isNumeric(row.MaxVDiskSlotUsage)
                ? roundToPrecision(row.MaxVDiskSlotUsage, 4)
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
        name: CAPACITY_METRICS_COLUMN_IDS.VDiskRawUsage,
        header: CAPACITY_METRICS_COLUMN_TITLES.VDiskRawUsage,
        width: 150,
        render: ({row}) => {
            return isNumeric(row.MaxVDiskRawUsage)
                ? roundToPrecision(row.MaxVDiskRawUsage, 4)
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.CENTER,
    };
}

export function getNormalizedOccupancyColumn<
    T extends {MaxNormalizedOccupancy?: number},
>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.NormalizedOccupancy,
        header: CAPACITY_METRICS_COLUMN_TITLES.NormalizedOccupancy,
        width: 200,
        render: ({row}) => {
            return isNumeric(row.MaxNormalizedOccupancy)
                ? roundToPrecision(row.MaxNormalizedOccupancy, 5)
                : EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.CENTER,
    };
}
