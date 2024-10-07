import {ASCENDING, DESCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';

import {NODES_COLUMNS_IDS} from '../../../components/nodesColumns/constants';
import type {NodesSortParams} from '../../../store/reducers/nodes/types';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {
    PreparedStorageGroup,
    StorageSortParams,
    VisibleEntities,
} from '../../../store/reducers/storage/types';
import {valueIsDefined} from '../../../utils';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {generateEvaluator} from '../../../utils/generateEvaluator';
import {STORAGE_GROUPS_COLUMNS_IDS} from '../StorageGroups/columns/constants';
import type {StorageViewContext} from '../types';

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

export const defaultSortNode: NodesSortParams = {
    sortValue: NODES_COLUMNS_IDS.NodeId,
    sortOrder: ASCENDING,
};

const defaultSortGroup: StorageSortParams = {
    sortValue: STORAGE_GROUPS_COLUMNS_IDS.PoolName,
    sortOrder: ASCENDING,
};

const defaultSortGroupMissing: StorageSortParams = {
    sortValue: STORAGE_GROUPS_COLUMNS_IDS.Degraded,
    sortOrder: DESCENDING,
};

const defaultSortGroupSpace: StorageSortParams = {
    sortValue: STORAGE_GROUPS_COLUMNS_IDS.Usage,
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

export function isVdiskActive(vDisk: PreparedVDisk, viewContext?: StorageViewContext) {
    let isActive = true;
    if (valueIsDefined(vDisk.VDiskId?.GroupID) && viewContext?.groupId) {
        isActive &&= String(vDisk.VDiskId.GroupID) === viewContext.groupId;
    }

    if (valueIsDefined(vDisk.NodeId) && viewContext?.nodeId) {
        isActive &&= String(vDisk.NodeId) === viewContext.nodeId;
    }

    if (valueIsDefined(vDisk.PDiskId) && viewContext?.pDiskId) {
        isActive &&= String(vDisk.PDiskId) === viewContext.pDiskId;
    }

    if (valueIsDefined(vDisk.VDiskSlotId) && viewContext?.vDiskSlotId) {
        isActive &&= String(vDisk.VDiskSlotId) === viewContext.vDiskSlotId;
    }

    return isActive;
}

const DEFAULT_ENTITIES_COUNT = 10;

// NodePage -  1 node
// GroupPage - DEFAULT_ENTITIES_COUNT nodes
// PDiskPage - 1 node
// VDiskPage - 1 node
export function getStorageNodesInitialEntitiesCount({
    nodeId,
    pDiskId,
    vDiskSlotId,
}: StorageViewContext): number | undefined {
    if (valueIsDefined(nodeId) || valueIsDefined(pDiskId) || valueIsDefined(vDiskSlotId)) {
        return 1;
    }

    return DEFAULT_ENTITIES_COUNT;
}

// NodePage - DEFAULT_ENTITIES_COUNT groups
// GroupPage - 1 group
// PDiskPage - DEFAULT_ENTITIES_COUNT groups
// VDiskPage - 1 group
export function getStorageGroupsInitialEntitiesCount({
    vDiskSlotId,
    groupId,
}: StorageViewContext): number | undefined {
    if (valueIsDefined(groupId)) {
        return 1;
    }
    if (valueIsDefined(vDiskSlotId)) {
        return 1;
    }

    return DEFAULT_ENTITIES_COUNT;
}
