import React from 'react';

import {selectNodesMap} from '../../../store/reducers/nodesList';
import type {PreparedStorageGroup} from '../../../store/reducers/storage/types';
import {valueIsDefined} from '../../../utils';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {generateEvaluator} from '../../../utils/generateEvaluator';
import {useTypedSelector} from '../../../utils/hooks';
import type {StorageViewContext} from '../types';

const defaultDegradationEvaluator = generateEvaluator(['success', 'warning', 'danger'], 1, 2);

const degradationEvaluators = {
    'block-4-2': generateEvaluator(['success', 'warning', 'danger'], 1, 2),
    'mirror-3-dc': generateEvaluator(['success', 'warning', 'danger'], 1, 3),
};

const canEvaluateErasureSpecies = (value?: string): value is keyof typeof degradationEvaluators =>
    value !== undefined && value in degradationEvaluators;

export const getDegradedSeverity = (group: PreparedStorageGroup) => {
    const evaluate = canEvaluateErasureSpecies(group.ErasureSpecies)
        ? degradationEvaluators[group.ErasureSpecies]
        : defaultDegradationEvaluator;

    return evaluate(group.Degraded);
};

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
export function getStorageNodesInitialEntitiesCount(
    context?: StorageViewContext,
): number | undefined {
    if (
        valueIsDefined(context?.nodeId) ||
        valueIsDefined(context?.pDiskId) ||
        valueIsDefined(context?.vDiskSlotId)
    ) {
        return 1;
    }

    return DEFAULT_ENTITIES_COUNT;
}

// NodePage - DEFAULT_ENTITIES_COUNT groups
// GroupPage - 1 group
// PDiskPage - DEFAULT_ENTITIES_COUNT groups
// VDiskPage - 1 group
export function getStorageGroupsInitialEntitiesCount(
    context?: StorageViewContext,
): number | undefined {
    if (valueIsDefined(context?.groupId)) {
        return 1;
    }
    if (valueIsDefined(context?.vDiskSlotId)) {
        return 1;
    }

    return DEFAULT_ENTITIES_COUNT;
}

export function useVDisksWithDCMargins(vDisks: PreparedVDisk[] = []) {
    const nodesMap = useTypedSelector(selectNodesMap);

    return React.useMemo(() => {
        const disksWithMargins: number[] = [];

        // Backend returns disks sorted by DC, so we don't need to apply any additional sorting
        vDisks.forEach((disk, index) => {
            const dc1 = nodesMap?.get(Number(disk?.NodeId))?.DC;
            const dc2 = nodesMap?.get(Number(vDisks[index + 1]?.NodeId))?.DC;

            if (dc1 !== dc2) {
                disksWithMargins.push(index);
            }
        });

        return disksWithMargins;
    }, [vDisks, nodesMap]);
}
