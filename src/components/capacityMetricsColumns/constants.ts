import type {ValueOf} from '../../types/common';

import i18n from './i18n';

export const CAPACITY_METRICS_COLUMN_IDS = {
    PDiskUsage: 'PDiskUsage',
    VDiskSlotUsage: 'VDiskSlotUsage',
    VDiskRawUsage: 'VDiskRawUsage',
    NormalizedOccupancy: 'NormalizedOccupancy',
    CapacityAlert: 'CapacityAlert',
} as const;

export type CapacityMetricsColumnId = ValueOf<typeof CAPACITY_METRICS_COLUMN_IDS>;

export const CAPACITY_METRICS_COLUMN_TITLES = {
    get PDiskUsage() {
        return i18n('pdisk-usage');
    },
    get VDiskSlotUsage() {
        return i18n('vdisk-slot-usage');
    },
    get VDiskRawUsage() {
        return i18n('vdisk-raw-usage');
    },
    get NormalizedOccupancy() {
        return i18n('normalized-occupancy');
    },
    get CapacityAlert() {
        return i18n('capacity-alert');
    },
} as const satisfies Record<CapacityMetricsColumnId, string>;
