import type {
    TGroupsStorageGroupInfo,
    TStorageStatsMediaEntry,
    TStorageStatsPathEntry,
} from '../../../types/api/storage';
import {
    HDD_MEDIA_TYPE,
    SSD_MEDIA_TYPE,
    UNKNOWN_MEDIA_TYPE,
    normalizeMediaType,
} from '../../../utils/disks/normalizeMediaType';
import {api} from '../api';

export {normalizeMediaType, UNKNOWN_MEDIA_TYPE} from '../../../utils/disks/normalizeMediaType';

export interface StorageUsageGroupRow {
    groupId: string;
    used: number;
    share: number;
    storageCount: number;
    erasure?: string;
    limit?: number;
    poolName?: string;
    mediaType?: string;
}

export interface StorageUsageSection {
    mediaKey: string;
    mediaLabel: string;
    dataSize?: number;
    diskUsage: number;
    overhead?: number;
    storageGroupsCount: number;
    rows: StorageUsageGroupRow[];
}

export interface StorageUsageMediaStats {
    dataSize?: number;
    diskUsage?: number;
}

export type StorageUsageMediaStatsByType = Record<string, StorageUsageMediaStats>;

export interface StorageUsageData {
    diskUsage: number;
    mediaStatsByType: StorageUsageMediaStatsByType;
    storageGroupsCount: number;
    rows: StorageUsageGroupRow[];
}

interface GetStorageUsageParams {
    path: string;
    database: string;
    databaseFullPath: string;
    useMetaProxy?: boolean;
}

interface FetchStorageUsageOptions {
    signal?: AbortSignal;
}

interface PathStatsMatchParams {
    path: string;
    databaseFullPath?: string;
    useMetaProxy?: boolean;
}

type StorageUsageQueryResult =
    | {
          data: StorageUsageData;
      }
    | {
          error: unknown;
      };

const STORAGE_GROUPS_BATCH_SIZE = 100;

function getRelativeStorageStatsPath({path, databaseFullPath, useMetaProxy}: PathStatsMatchParams) {
    if (!useMetaProxy || !databaseFullPath) {
        return undefined;
    }

    if (path === databaseFullPath) {
        return '';
    }

    if (path.startsWith(databaseFullPath + '/')) {
        return path.slice(databaseFullPath.length + 1);
    }

    return undefined;
}

export function getPathStats(
    stats: TStorageStatsPathEntry[] | undefined,
    params: PathStatsMatchParams,
): TStorageStatsPathEntry | undefined {
    const pathCandidates = new Set([params.path]);
    const relativePath = getRelativeStorageStatsPath(params);

    if (relativePath !== undefined) {
        pathCandidates.add(relativePath);
    }

    return stats?.find((entry) => {
        return (
            (typeof entry.FullPath === 'string' && pathCandidates.has(entry.FullPath)) ||
            (typeof entry.Path === 'string' && pathCandidates.has(entry.Path))
        );
    });
}

function normalizeLimit(limit: TGroupsStorageGroupInfo['Limit']) {
    const parsedLimit = Number(limit);

    return Number.isFinite(parsedLimit) ? parsedLimit : undefined;
}

export function normalizeShare(used: number, diskUsage: number) {
    if (diskUsage <= 0 || used <= 0) {
        return 0;
    }

    return used / diskUsage;
}

function normalizeSectionOverhead(diskUsage: number, dataSize: number | undefined) {
    if (!dataSize || dataSize <= 0 || diskUsage <= 0) {
        return undefined;
    }

    return diskUsage / dataSize;
}

function getMediaSectionSortOrder(mediaKey: string) {
    switch (mediaKey) {
        case SSD_MEDIA_TYPE:
            return 0;
        case HDD_MEDIA_TYPE:
            return 1;
        case UNKNOWN_MEDIA_TYPE:
            return 99;
        default:
            return 50;
    }
}

function normalizeMetricValue(value: number | undefined) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function buildMediaStatsByType(
    mediaEntries: number | TStorageStatsMediaEntry[] | undefined,
): StorageUsageMediaStatsByType {
    if (!Array.isArray(mediaEntries)) {
        return {};
    }

    return mediaEntries.reduce<StorageUsageMediaStatsByType>((statsByType, mediaEntry) => {
        const dataSize = normalizeMetricValue(mediaEntry.DataSize);
        const diskUsage = normalizeMetricValue(mediaEntry.StorageSize);

        if (dataSize === undefined && diskUsage === undefined) {
            return statsByType;
        }

        const mediaKey = normalizeMediaType(mediaEntry.Kind);
        const existingStats = statsByType[mediaKey];

        return {
            ...statsByType,
            [mediaKey]: {
                dataSize:
                    dataSize === undefined
                        ? existingStats?.dataSize
                        : (existingStats?.dataSize ?? 0) + dataSize,
                diskUsage:
                    diskUsage === undefined
                        ? existingStats?.diskUsage
                        : (existingStats?.diskUsage ?? 0) + diskUsage,
            },
        };
    }, {});
}

async function fetchStorageGroupsByIds({
    database,
    groupIds,
    signal,
}: {
    database: string;
    groupIds: string[];
    signal?: AbortSignal;
}) {
    const storageGroups: TGroupsStorageGroupInfo[] = [];

    for (let index = 0; index < groupIds.length; index += STORAGE_GROUPS_BATCH_SIZE) {
        const groupIdsBatch = groupIds.slice(index, index + STORAGE_GROUPS_BATCH_SIZE);
        const groupsInfo = await window.api.storage.getStorageGroups(
            {
                database,
                groupId: groupIdsBatch,
                fieldsRequired: ['GroupId', 'Limit', 'PoolName', 'MediaType', 'Erasure'],
            },
            {signal},
        );

        storageGroups.push(...(groupsInfo.StorageGroups ?? []));
    }

    return storageGroups;
}

export function buildStorageUsageRows(
    rawRows: Array<{GroupId?: string; StorageSize?: number; StorageCount?: number}>,
    groupsById: Map<string, TGroupsStorageGroupInfo>,
    diskUsage: number,
) {
    return rawRows
        .filter((row): row is {GroupId: string; StorageSize?: number; StorageCount?: number} => {
            return typeof row.GroupId === 'string';
        })
        .map((row) => {
            const used = Number(row.StorageSize) || 0;
            const groupInfo = groupsById.get(row.GroupId);

            return {
                groupId: row.GroupId,
                used,
                share: normalizeShare(used, diskUsage),
                storageCount: Number(row.StorageCount) || 0,
                erasure: groupInfo?.ErasureSpecies,
                limit: normalizeLimit(groupInfo?.Limit),
                poolName: groupInfo?.PoolName,
                mediaType: normalizeMediaType(groupInfo?.MediaType),
            };
        })
        .sort((left, right) => right.used - left.used);
}

export function buildStorageUsageSections(
    rows: StorageUsageGroupRow[],
    overallDataSize: number | undefined,
    totalDiskUsage: number,
    mediaStatsByType: StorageUsageMediaStatsByType = {},
) {
    const groupedSections = rows.reduce((sections, row) => {
        const mediaKey = normalizeMediaType(row.mediaType);
        const existingSection = sections.get(mediaKey);

        if (existingSection) {
            existingSection.diskUsage += row.used;
            existingSection.storageGroupsCount += 1;
            existingSection.rows.push({...row, mediaType: mediaKey});
            return sections;
        }

        sections.set(mediaKey, {
            mediaKey,
            mediaLabel: mediaKey,
            diskUsage: row.used,
            storageGroupsCount: 1,
            rows: [{...row, mediaType: mediaKey}],
        });

        return sections;
    }, new Map<string, Omit<StorageUsageSection, 'dataSize' | 'overhead'>>());
    const hasMultipleMediaTypes = groupedSections.size > 1;

    return Array.from(groupedSections.values())
        .map((section) => {
            const sectionMediaStats = mediaStatsByType[section.mediaKey];
            const diskUsage =
                sectionMediaStats?.diskUsage ??
                (hasMultipleMediaTypes ? section.diskUsage : totalDiskUsage || section.diskUsage);
            const dataSize =
                sectionMediaStats?.dataSize ??
                (hasMultipleMediaTypes ? undefined : overallDataSize);

            return {
                ...section,
                diskUsage,
                dataSize,
                overhead: normalizeSectionOverhead(diskUsage, dataSize),
                rows: section.rows.sort((left, right) => right.used - left.used),
            };
        })
        .sort((left, right) => {
            const sortOrderDiff =
                getMediaSectionSortOrder(left.mediaKey) - getMediaSectionSortOrder(right.mediaKey);

            if (sortOrderDiff !== 0) {
                return sortOrderDiff;
            }

            return left.mediaLabel.localeCompare(right.mediaLabel);
        });
}

export async function fetchStorageUsageData(
    {path, database, databaseFullPath, useMetaProxy}: GetStorageUsageParams,
    {signal}: FetchStorageUsageOptions = {},
): Promise<StorageUsageQueryResult> {
    try {
        const storageStats = await window.api.viewer.getStorageStats(
            {
                database,
                path: {path, databaseFullPath, useMetaProxy},
                groupBy: 'path',
                groups: true,
                media: true,
            },
            {signal},
        );

        const pathStats = getPathStats(storageStats.Paths, {path, databaseFullPath, useMetaProxy});

        if (!pathStats) {
            throw new Error(`Storage stats path entry was not found for "${path}"`);
        }

        const rawRows = Array.isArray(pathStats?.Groups) ? pathStats.Groups : [];
        const diskUsage = Number(pathStats?.StorageSize) || 0;
        const mediaStatsByType = buildMediaStatsByType(pathStats?.Media);

        const groupIds = Array.from(
            new Set(
                rawRows
                    .map((row) => row.GroupId)
                    .filter((groupId): groupId is string => typeof groupId === 'string'),
            ),
        );

        let groupsById = new Map<string, TGroupsStorageGroupInfo>();

        if (groupIds.length > 0) {
            const storageGroups = await fetchStorageGroupsByIds({database, groupIds, signal});

            groupsById = new Map(
                storageGroups
                    .filter(
                        (group): group is TGroupsStorageGroupInfo & {GroupId: string} =>
                            typeof group.GroupId === 'string',
                    )
                    .map((group) => [group.GroupId, group]),
            );
        }

        const rows = buildStorageUsageRows(rawRows, groupsById, diskUsage);

        return {
            data: {
                diskUsage,
                mediaStatsByType,
                storageGroupsCount: rows.length,
                rows,
            },
        };
    } catch (error) {
        return {error};
    }
}

export const storageUsageApi = api.injectEndpoints({
    endpoints: (build) => ({
        getStorageUsage: build.query<StorageUsageData, GetStorageUsageParams>({
            queryFn: async ({path, database, databaseFullPath, useMetaProxy}, {signal}) => {
                return fetchStorageUsageData(
                    {path, database, databaseFullPath, useMetaProxy},
                    {signal},
                );
            },
            serializeQueryArgs: ({queryArgs}) => {
                const {database, path} = queryArgs;

                return {database, path};
            },
            keepUnusedDataFor: 0,
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
