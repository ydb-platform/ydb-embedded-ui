import type {TClusterInfoV2, TStorageStats} from '../../../types/api/cluster';
import type {ExecuteQueryResponse, KeyValueRow} from '../../../types/api/query';
import {parseQueryAPIExecuteResponse} from '../../../utils/query';

import type {ClusterGroupsStats} from './types';

export const createSelectClusterGroupsQuery = (clusterRoot: string) => {
    return `
SELECT 
    PDiskFilter,
    ErasureSpecies,
    CurrentAvailableSize,
    CurrentAllocatedSize,
    CurrentGroupsCreated,
    AvailableGroupsToCreate
    FROM \`${clusterRoot}/.sys/ds_storage_stats\`
    ORDER BY CurrentGroupsCreated DESC;
`;
};

const getDiskType = (rawTypeString: string) => {
    // Check if value math regexp and put disk type in type group
    const diskTypeRe = /^Type:(?<type>[A-Za-z]+)/;

    const diskType = rawTypeString.match(diskTypeRe)?.groups?.['type'];

    if (diskType === 'ROT') {
        // Display ROT as HDD
        return 'HDD';
    }

    return diskType;
};

function getGroupStats(data?: KeyValueRow[] | TStorageStats[]) {
    const result: ClusterGroupsStats = {};

    data?.forEach((stats) => {
        const {
            PDiskFilter,
            ErasureSpecies: erasure,
            CurrentAvailableSize,
            CurrentAllocatedSize,
            CurrentGroupsCreated,
            AvailableGroupsToCreate,
        } = stats;

        const createdGroups = Number(CurrentGroupsCreated) || 0;
        const availableGroupsToCreate = Number(AvailableGroupsToCreate) || 0;
        const totalGroups = createdGroups + availableGroupsToCreate;
        const allocatedSize = Number(CurrentAllocatedSize) || 0;
        const availableSize = Number(CurrentAvailableSize) || 0;
        const diskType = PDiskFilter && typeof PDiskFilter === 'string' && getDiskType(PDiskFilter);

        if (diskType && erasure && typeof erasure === 'string' && createdGroups) {
            const preparedStats = {
                diskType,
                erasure,
                createdGroups,
                totalGroups,
                allocatedSize,
                availableSize,
            };

            if (result[diskType]) {
                if (result[diskType][erasure]) {
                    const currentValue = {...result[diskType][erasure]};
                    result[diskType][erasure] = {
                        diskType,
                        erasure,
                        createdGroups: currentValue.createdGroups + createdGroups,
                        totalGroups: currentValue.totalGroups + totalGroups,
                        allocatedSize: currentValue.allocatedSize + allocatedSize,
                        availableSize: currentValue.availableSize + availableSize,
                    };
                } else {
                    result[diskType][erasure] = preparedStats;
                }
            } else {
                result[diskType] = {[erasure]: preparedStats};
            }
        }
    });

    return result;
}

export const parseGroupsStatsQueryResponse = (
    data: ExecuteQueryResponse<'modern'>,
): ClusterGroupsStats => {
    const parsedData = parseQueryAPIExecuteResponse(data).result;
    return getGroupStats(parsedData);
};

export function getGroupStatsFromClusterInfo(info: TClusterInfoV2) {
    return getGroupStats(info.StorageStats);
}
