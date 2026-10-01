import type {ESysViewType} from '../types/api/schema/sysView';
import {SYS_VIEW_TYPE_IDS} from '../types/api/schema/sysView';

const SYS_VIEW_TYPE_NAMES_BY_ID = new Map<number, ESysViewType>(
    (Object.keys(SYS_VIEW_TYPE_IDS) as ESysViewType[]).map(
        (name) => [SYS_VIEW_TYPE_IDS[name], name] as const,
    ),
);

/**
 * Normalizes SysViewDescription.Type for display.
 * YDB <= 26.3.1.x returns the enum name ("EVSlots"),
 * YDB with ydb-platform/ydb#54332 returns the numeric value (13).
 */
export function prepareSystemViewType(type?: string | number | null): string | undefined {
    if (type === undefined || type === null || type === '') {
        return undefined;
    }

    // Ids unknown to this UI version are shown as-is instead of hiding the row
    const name =
        typeof type === 'number' ? (SYS_VIEW_TYPE_NAMES_BY_ID.get(type) ?? String(type)) : type;

    // System view type is enum, its format from backend is EType
    // We need to display only Type, remove redundant E
    // EStoragePools -> StoragePools, EStorageStats -> StorageStats
    if (name.startsWith('E')) {
        return name.slice(1);
    }
    return name;
}
