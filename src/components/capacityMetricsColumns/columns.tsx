import DataTable from '@gravity-ui/react-data-table';
import type {LabelProps} from '@gravity-ui/uikit';
import {Label} from '@gravity-ui/uikit';

import {isCapacityAlert} from '../../types/api/enums';
import {getCapacityAlertTheme, normalizeCapacityAlert} from '../../utils/capacityAlerts';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatNormalizedMetricPercent} from '../../utils/storageMetrics';
import type {Column} from '../../utils/tableUtils/types';
import {isNumeric, parseOptionalNonNegativeNumber} from '../../utils/utils';
import {TitleWithHelpMark} from '../TitleWithHelpmark/TitleWithHelpmark';

import {
    CAPACITY_METRICS_COLUMN_IDS,
    CAPACITY_METRICS_COLUMN_TITLES,
    CAPACITY_METRICS_HELP_TEXT,
} from './constants';

export function getPDiskUsageColumn<T extends {MaxPDiskUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxPDiskUsage,
        header: (
            <TitleWithHelpMark
                header={CAPACITY_METRICS_COLUMN_TITLES.MaxPDiskUsage}
                note={CAPACITY_METRICS_HELP_TEXT.MaxPDiskUsage}
            />
        ),
        width: 150,
        render: ({row}) => {
            return formatNormalizedMetricPercent(row.MaxPDiskUsage);
        },
        align: DataTable.RIGHT,
    };
}

export function getVDiskSlotUsageColumn<
    T extends {MaxVDiskSlotUsage?: number; CapacityAlert?: string},
>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxVDiskSlotUsage,
        header: (
            <TitleWithHelpMark
                header={CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage}
                note={CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage}
            />
        ),
        width: 180,
        render: ({row}) => {
            const theme: LabelProps['theme'] = isCapacityAlert(row.CapacityAlert)
                ? getCapacityAlertTheme(row.CapacityAlert)
                : 'normal';

            return isNumeric(row.MaxVDiskSlotUsage) ? (
                <Label theme={theme}>{formatNormalizedMetricPercent(row.MaxVDiskSlotUsage)}</Label>
            ) : (
                EMPTY_DATA_PLACEHOLDER
            );
        },
        align: DataTable.RIGHT,
    };
}

export function getCapacityAlertColumn<T extends {CapacityAlert?: string}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.CapacityAlert,
        header: (
            <TitleWithHelpMark
                header={CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert}
                note={CAPACITY_METRICS_HELP_TEXT.CapacityAlert}
            />
        ),
        width: 150,
        render: ({row}) => {
            return normalizeCapacityAlert(row.CapacityAlert) ?? EMPTY_DATA_PLACEHOLDER;
        },
        align: DataTable.CENTER,
    };
}

export function getVDiskRawUsageColumn<T extends {MaxVDiskRawUsage?: number}>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxVDiskRawUsage,
        header: (
            <TitleWithHelpMark
                header={CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage}
                note={CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage}
            />
        ),
        width: 180,
        render: ({row}) => {
            return formatNormalizedMetricPercent(row.MaxVDiskRawUsage);
        },
        align: DataTable.RIGHT,
    };
}

export function getNormalizedOccupancyColumn<
    T extends {MaxNormalizedOccupancy?: number},
>(): Column<T> {
    return {
        name: CAPACITY_METRICS_COLUMN_IDS.MaxNormalizedOccupancy,
        header: (
            <TitleWithHelpMark
                header={CAPACITY_METRICS_COLUMN_TITLES.MaxNormalizedOccupancy}
                note={CAPACITY_METRICS_HELP_TEXT.MaxNormalizedOccupancy}
            />
        ),
        width: 200,
        render: ({row}) => {
            const normalizedOccupancy = parseOptionalNonNegativeNumber(row.MaxNormalizedOccupancy);

            return normalizedOccupancy === undefined
                ? EMPTY_DATA_PLACEHOLDER
                : normalizedOccupancy.toFixed(2);
        },
        align: DataTable.RIGHT,
    };
}
