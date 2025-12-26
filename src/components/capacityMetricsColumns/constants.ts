import type {ValueOf} from '../../types/common';

import i18n from './i18n';

export const CAPACITY_METRICS_COLUMN_IDS = {
    MaxPDiskUsage: 'MaxPDiskUsage',
    MaxVDiskSlotUsage: 'MaxVDiskSlotUsage',
    MaxVDiskRawUsage: 'MaxVDiskRawUsage',
    MaxNormalizedOccupancy: 'MaxNormalizedOccupancy',
    CapacityAlert: 'CapacityAlert',
} as const;

export type CapacityMetricsColumnId = ValueOf<typeof CAPACITY_METRICS_COLUMN_IDS>;

export const CAPACITY_METRICS_COLUMN_TITLES = {
    get MaxPDiskUsage() {
        return i18n('max-pdisk-usage');
    },
    get MaxVDiskSlotUsage() {
        return i18n('max-vdisk-slot-usage');
    },
    get MaxVDiskRawUsage() {
        return i18n('max-vdisk-raw-usage');
    },
    get MaxNormalizedOccupancy() {
        return i18n('max-normalized-occupancy');
    },
    get CapacityAlert() {
        return i18n('capacity-alert');
    },
} as const satisfies Record<CapacityMetricsColumnId, string>;
