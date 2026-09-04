import type {ClusterGroupsStats} from '../../../../../store/reducers/cluster/types';

const DISK_TYPE_ORDER = ['HDD', 'SSD'];
const ERASURE_ORDER = ['block-4-2', 'mirror-3-dc', 'mirror-3of4', 'none'];

export interface PreparedErasureGroupsStats {
    erasure: string;
    createdGroups: number;
    availableGroups: number;
}

export interface PreparedDiskGroupsStats {
    diskType: string;
    erasures: PreparedErasureGroupsStats[];
    allocatedGroups: number;
    availableGroups: {
        min: number;
        max: number;
        average: number;
    };
    progressTotalGroups: number;
}

export interface PreparedClusterGroupsStats {
    disks: PreparedDiskGroupsStats[];
    allocatedGroups: number;
}

function getErasureOrder(erasure: string) {
    const index = ERASURE_ORDER.indexOf(erasure);

    return index === -1 ? ERASURE_ORDER.length : index;
}

function getDiskTypeOrder(diskType: string) {
    const index = DISK_TYPE_ORDER.indexOf(diskType);

    return index === -1 ? DISK_TYPE_ORDER.length : index;
}

export function prepareClusterGroupsStats(
    groupStats: ClusterGroupsStats,
): PreparedClusterGroupsStats {
    let allocatedGroups = 0;

    const disks = Object.entries(groupStats)
        .map(([diskType, diskStats]) => {
            const erasures = Object.values(diskStats)
                .map((stats) => ({
                    erasure: stats.erasure,
                    createdGroups: stats.createdGroups,
                    availableGroups: stats.totalGroups - stats.createdGroups,
                }))
                .sort((a, b) => getErasureOrder(a.erasure) - getErasureOrder(b.erasure));

            const diskAllocatedGroups = erasures.reduce(
                (sum, stats) => sum + stats.createdGroups,
                0,
            );
            const availableValues = erasures.map((stats) => stats.availableGroups);
            const minAvailableGroups = Math.min(...availableValues);
            const maxAvailableGroups = Math.max(...availableValues);
            const averageAvailableGroups = (minAvailableGroups + maxAvailableGroups) / 2;

            allocatedGroups += diskAllocatedGroups;

            return {
                diskType,
                erasures,
                allocatedGroups: diskAllocatedGroups,
                availableGroups: {
                    min: minAvailableGroups,
                    max: maxAvailableGroups,
                    average: averageAvailableGroups,
                },
                progressTotalGroups: diskAllocatedGroups + averageAvailableGroups,
            };
        })
        .sort((a, b) => getDiskTypeOrder(a.diskType) - getDiskTypeOrder(b.diskType));

    return {disks, allocatedGroups};
}
