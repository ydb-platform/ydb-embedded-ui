import type {ESysViewType} from '../types/api/schema/sysView';

export function prepareSystemViewType(type?: ESysViewType) {
    if (!type) {
        return undefined;
    }
    // System view type is enum, its format from backend is EType
    // We need to display only Type, remove redundant E
    // EStoragePools -> StoragePools, EStorageStats -> StorageStats
    if (type.startsWith('E')) {
        return type.slice(1);
    }
    return type;
}
