import type {FeatureFlagConfig} from '../types/api/featureFlags';
import type {CompactMetadata, TOperation} from '../types/api/operations';
import {CompactState, OPERATION_METADATA_TYPE_URLS} from '../types/api/operations';

import {QUERY_TECHNICAL_MARK} from './constants';

export const FORCED_COMPACTION_FEATURE_FLAG = 'EnableForcedCompactions';
export const TABLE_COMPACTION_OPERATION_PAGE_SIZE = 100;

export interface TableCompactionOptions {
    cascade: boolean;
    maxShardsInFlight?: number;
}

export interface StartTableCompactionParams extends TableCompactionOptions {
    database: string;
    path: string;
}

export function isFeatureFlagEnabled(featureFlags: FeatureFlagConfig[] | undefined, name: string) {
    const featureFlag = featureFlags?.find((flag) => flag.Name === name);

    return Boolean(featureFlag && (featureFlag.Current ?? featureFlag.Default));
}

export function isForcedCompactionEnabled(featureFlags: FeatureFlagConfig[] | undefined) {
    return isFeatureFlagEnabled(featureFlags, FORCED_COMPACTION_FEATURE_FLAG);
}

export function createTableCompactionQuery(path: string, options: TableCompactionOptions) {
    const safePath = path.replace(/`/g, '``');
    const queryOptions = [`CASCADE = ${options.cascade ? 'true' : 'false'}`];

    if (
        typeof options.maxShardsInFlight === 'number' &&
        Number.isInteger(options.maxShardsInFlight) &&
        options.maxShardsInFlight > 0
    ) {
        queryOptions.push(`MAX_SHARDS_IN_FLIGHT = ${options.maxShardsInFlight}`);
    }

    return `${QUERY_TECHNICAL_MARK}\nALTER TABLE \`${safePath}\` COMPACT WITH (${queryOptions.join(', ')})`;
}

export function isCompactMetadata(metadata: TOperation['metadata']): metadata is CompactMetadata {
    return metadata?.['@type'] === OPERATION_METADATA_TYPE_URLS.Compact;
}

export function getCompactionProgress(operation?: TOperation) {
    const {metadata} = operation ?? {};

    if (!isCompactMetadata(metadata) || typeof metadata.progress !== 'number') {
        return undefined;
    }

    return Math.max(0, Math.min(100, Math.round(metadata.progress)));
}

export function getCompactionShardProgress(operation?: TOperation) {
    const {metadata} = operation ?? {};

    if (!isCompactMetadata(metadata)) {
        return undefined;
    }

    const {shards_done: shardsDone, shards_total: shardsTotal} = metadata;

    if (typeof shardsDone !== 'number' || typeof shardsTotal !== 'number' || shardsTotal <= 0) {
        return undefined;
    }

    return {shardsDone, shardsTotal};
}

export function isRunningTableCompactionOperation(operation: TOperation, path: string) {
    const {metadata} = operation;

    if (!isCompactMetadata(metadata) || metadata.path !== path) {
        return false;
    }

    return (
        operation.ready !== true &&
        metadata.state !== CompactState.STATE_DONE &&
        metadata.state !== CompactState.STATE_CANCELLED
    );
}

export function findRunningTableCompactionOperation(
    operations: TOperation[] | undefined,
    path: string,
) {
    return operations?.find((operation) => isRunningTableCompactionOperation(operation, path));
}
