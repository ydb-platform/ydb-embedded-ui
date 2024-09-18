import {ASCENDING, DESCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';

import type {NodesSortParams} from '../../../store/reducers/nodes/types';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {
    PreparedStorageGroup,
    StorageSortParams,
    VisibleEntities,
} from '../../../store/reducers/storage/types';
import {EFlag} from '../../../types/api/enums';
import {generateEvaluator} from '../../../utils/generateEvaluator';
import {NODES_COLUMNS_IDS} from '../../Nodes/columns/constants';
import {GROUPS_COLUMNS_IDS} from '../StorageGroups/columns/getStorageGroupsColumns';

const defaultDegradationEvaluator = generateEvaluator(1, 2, ['success', 'warning', 'danger']);

const degradationEvaluators = {
    'block-4-2': generateEvaluator(1, 2, ['success', 'warning', 'danger']),
    'mirror-3-dc': generateEvaluator(1, 3, ['success', 'warning', 'danger']),
};

const canEvaluateErasureSpecies = (value?: string): value is keyof typeof degradationEvaluators =>
    value !== undefined && value in degradationEvaluators;

export const getDegradedSeverity = (group: PreparedStorageGroup) => {
    const evaluate = canEvaluateErasureSpecies(group.ErasureSpecies)
        ? degradationEvaluators[group.ErasureSpecies]
        : defaultDegradationEvaluator;

    return evaluate(group.Degraded);
};

export const getUsageSeverityForStorageGroup = generateEvaluator(80, 85, [
    'success',
    'warning',
    'danger',
]);
export const getUsageSeverityForEntityStatus = generateEvaluator(80, 85, [
    EFlag.Green,
    EFlag.Yellow,
    EFlag.Red,
]);

export const defaultSortNode: NodesSortParams = {
    sortValue: NODES_COLUMNS_IDS.NodeId,
    sortOrder: ASCENDING,
};

const defaultSortGroup: StorageSortParams = {
    sortValue: GROUPS_COLUMNS_IDS.PoolName,
    sortOrder: ASCENDING,
};

const defaultSortGroupMissing: StorageSortParams = {
    sortValue: GROUPS_COLUMNS_IDS.Degraded,
    sortOrder: DESCENDING,
};

const defaultSortGroupSpace: StorageSortParams = {
    sortValue: GROUPS_COLUMNS_IDS.Usage,
    sortOrder: DESCENDING,
};

export function getDefaultSortGroup(visibleEntities: VisibleEntities) {
    if (visibleEntities === VISIBLE_ENTITIES.missing) {
        return defaultSortGroupMissing;
    }
    if (visibleEntities === VISIBLE_ENTITIES.space) {
        return defaultSortGroupSpace;
    }
    return defaultSortGroup;
}
