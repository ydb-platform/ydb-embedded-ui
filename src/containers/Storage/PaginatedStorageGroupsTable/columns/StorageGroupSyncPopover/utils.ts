import {BridgeSyncStatus} from '../../../../../types/api/cluster';
import type {TBridgeGroupSyncInfo} from '../../../../../types/api/storage';

export function parseSyncNumber(value?: string | number) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) {
        return undefined;
    }
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

export function parseSyncTimestamp(value?: string) {
    const microseconds = parseSyncNumber(value);
    if (!microseconds) {
        return undefined;
    }
    const milliseconds = microseconds / 1000;
    return Number.isFinite(new Date(milliseconds).getTime()) ? milliseconds : undefined;
}

export function hasSyncDetails(group: TBridgeGroupSyncInfo) {
    return (
        group.BridgeSyncStatus !== BridgeSyncStatus.NOT_REQUIRED &&
        group.BridgeSyncStatus !== undefined &&
        Object.values(BridgeSyncStatus).includes(group.BridgeSyncStatus)
    );
}
