import type {TBridgeInfo} from '../../../../types/api/cluster';
import {BridgeSyncStatus} from '../../../../types/api/cluster';

export function parseBridgeCount(value?: string | number): number | undefined {
    if (typeof value !== 'number' && typeof value !== 'string') {
        return undefined;
    }
    if (typeof value === 'string' && !/^\d+$/.test(value)) {
        return undefined;
    }
    const count = Number(value);
    return Number.isSafeInteger(count) && count >= 0 ? count : undefined;
}

export function getBridgeDatabaseCounts(bridgeInfo?: TBridgeInfo) {
    const counts = bridgeInfo?.DatabaseCountsBySyncStatus;
    if (counts === undefined || counts === null) {
        return undefined;
    }

    return Object.values(BridgeSyncStatus)
        .filter((status) => status !== BridgeSyncStatus.NOT_REQUIRED)
        .flatMap((status) => {
            const count = parseBridgeCount(counts[status]);
            return count === undefined ? [] : [{status, count}];
        });
}

export function getBridgeNodesProgress(total?: number, alive?: number) {
    const totalCount = parseBridgeCount(total);
    const aliveCount = parseBridgeCount(alive);
    if (totalCount === undefined || aliveCount === undefined || aliveCount > totalCount) {
        return undefined;
    }
    return totalCount === 0 ? 0 : (aliveCount / totalCount) * 100;
}
