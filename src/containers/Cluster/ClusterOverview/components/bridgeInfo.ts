import type {TBridgeInfo} from '../../../../types/api/cluster';
import {BridgeSyncStatus} from '../../../../types/api/cluster';
import {getUsage} from '../../../../utils/storage';
import {parseOptionalNonNegativeNumber} from '../../../../utils/utils';

export function getBridgeDatabaseCounts(bridgeInfo?: TBridgeInfo) {
    const counts = bridgeInfo?.DatabaseCountsBySyncStatus;
    if (counts === undefined || counts === null) {
        return undefined;
    }

    return Object.values(BridgeSyncStatus)
        .filter((status) => status !== BridgeSyncStatus.NOT_REQUIRED)
        .flatMap((status) => {
            const count = parseOptionalNonNegativeNumber(counts[status]);
            return count === undefined ? [] : [{status, count}];
        });
}

export function getBridgeNodesProgress(total?: number, alive?: number) {
    const totalCount = parseOptionalNonNegativeNumber(total);
    const aliveCount = parseOptionalNonNegativeNumber(alive);
    if (totalCount === undefined || aliveCount === undefined) {
        return undefined;
    }
    return getUsage({Used: aliveCount, Limit: totalCount});
}
