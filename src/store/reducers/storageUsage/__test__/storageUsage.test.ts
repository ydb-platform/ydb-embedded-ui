import type {YdbEmbeddedAPI} from '../../../../services/api';
import type {TGroupsStorageGroupInfo, TStorageStatsPathEntry} from '../../../../types/api/storage';
import {
    buildStorageUsageRows,
    buildStorageUsageSections,
    fetchStorageUsageData,
    getPathStats,
    normalizeMediaType,
    normalizeShare,
} from '../StorageUsage';

describe('storageUsage helpers', () => {
    const originalApi = window.api;
    const storageGroupsBatchSize = 100;

    afterEach(() => {
        window.api = originalApi;
    });

    test('getPathStats returns exact matched path entry', () => {
        const stats: TStorageStatsPathEntry[] = [
            {FullPath: '/local/a', Path: '/local/a', StorageSize: 10},
            {FullPath: '/local/b', Path: '/local/b', StorageSize: 20},
        ];

        expect(getPathStats(stats, {path: '/local/b'})).toEqual(stats[1]);
    });

    test('getPathStats matches relative path entry in meta-proxy mode', () => {
        const stats: TStorageStatsPathEntry[] = [
            {Path: 'a', StorageSize: 10},
            {Path: 'b', StorageSize: 20},
        ];

        expect(
            getPathStats(stats, {
                path: '/local/b',
                databaseFullPath: '/local',
                useMetaProxy: true,
            }),
        ).toEqual(stats[1]);
    });

    test('getPathStats returns undefined when path is missing', () => {
        const stats: TStorageStatsPathEntry[] = [
            {FullPath: '/local/a', Path: '/local/a', StorageSize: 10},
            {FullPath: '/local/b', Path: '/local/b', StorageSize: 20},
        ];

        expect(getPathStats(stats, {path: '/local/c'})).toBeUndefined();
    });

    test('normalizeShare returns zero for empty or invalid totals', () => {
        expect(normalizeShare(0, 100)).toBe(0);
        expect(normalizeShare(10, 0)).toBe(0);
        expect(normalizeShare(10, -1)).toBe(0);
    });

    test('normalizeMediaType converts ROT to HDD', () => {
        expect(normalizeMediaType('ROT,Kind:0')).toBe('HDD');
    });

    test('normalizeMediaType keeps SSD stable', () => {
        expect(normalizeMediaType('SSD,Kind:0')).toBe('SSD');
    });

    test('normalizeMediaType keeps unknown tokens stable', () => {
        expect(normalizeMediaType('NVME,Kind:0')).toBe('NVME');
    });

    test('buildStorageUsageRows merges group metadata and sorts rows by used size', () => {
        const groupsById = new Map<string, TGroupsStorageGroupInfo>([
            [
                '2181038080',
                {
                    GroupId: '2181038080',
                    Limit: '4000',
                    PoolName: 'dynamic_storage_pool:1',
                    MediaType: 'ROT,Kind:0',
                    ErasureSpecies: 'none',
                },
            ],
            [
                '2181038081',
                {
                    GroupId: '2181038081',
                    Limit: '8000',
                    PoolName: 'dynamic_storage_pool:2',
                    MediaType: 'SSD,Kind:0',
                    ErasureSpecies: 'mirror-3-dc',
                },
            ],
        ]);

        const rows = buildStorageUsageRows(
            [
                {GroupId: '2181038080', StorageSize: 1000, StorageCount: 10},
                {GroupId: '2181038081', StorageSize: 3000, StorageCount: 20},
            ],
            groupsById,
            4000,
        );

        expect(rows).toEqual([
            {
                groupId: '2181038081',
                used: 3000,
                share: 0.75,
                storageCount: 20,
                erasure: 'mirror-3-dc',
                limit: 8000,
                poolName: 'dynamic_storage_pool:2',
                mediaType: 'SSD',
            },
            {
                groupId: '2181038080',
                used: 1000,
                share: 0.25,
                storageCount: 10,
                erasure: 'none',
                limit: 4000,
                poolName: 'dynamic_storage_pool:1',
                mediaType: 'HDD',
            },
        ]);
    });

    test('fetchStorageUsageData returns error when storage groups request fails', async () => {
        const storageGroupsError = new Error('storage groups failed');
        const getStorageStats = jest.fn().mockResolvedValue({
            Paths: [
                {
                    Path: '/local/table',
                    FullPath: '/local/table',
                    StorageSize: 4000,
                    Groups: [
                        {GroupId: '2181038080', StorageSize: 1000, StorageCount: 10},
                        {GroupId: '2181038081', StorageSize: 3000, StorageCount: 20},
                    ],
                },
            ],
        });
        const getStorageGroups = jest.fn().mockRejectedValue(storageGroupsError);

        window.api = {
            viewer: {getStorageStats},
            storage: {getStorageGroups},
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchStorageUsageData({
            path: '/local/table',
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(getStorageStats).toHaveBeenCalledTimes(1);
        expect(getStorageGroups).toHaveBeenCalledTimes(1);
        expect(result).toEqual({error: storageGroupsError});
    });

    test('fetchStorageUsageData requests storage groups in a single batch for small tables', async () => {
        const groupIds = ['2181038080', '2181038081', '2181038082'];
        const getStorageStats = jest.fn().mockResolvedValue({
            Paths: [
                {
                    Path: '/local/table',
                    FullPath: '/local/table',
                    StorageSize: 6000,
                    Groups: groupIds.map((groupId, index) => ({
                        GroupId: groupId,
                        StorageSize: (index + 1) * 1000,
                        StorageCount: index + 1,
                    })),
                },
            ],
        });
        const getStorageGroups = jest.fn().mockResolvedValue({
            StorageGroups: groupIds.map((groupId, index) => ({
                GroupId: groupId,
                Limit: String((index + 1) * 4000),
                MediaType: 'SSD,Kind:0',
                ErasureSpecies: 'mirror-3-dc',
            })),
        });

        window.api = {
            viewer: {getStorageStats},
            storage: {getStorageGroups},
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchStorageUsageData({
            path: '/local/table',
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(getStorageGroups).toHaveBeenCalledTimes(1);
        expect(getStorageGroups).toHaveBeenCalledWith(
            {
                database: '/local',
                groupId: groupIds,
                fieldsRequired: ['GroupId', 'Limit', 'PoolName', 'MediaType', 'Erasure'],
            },
            {signal: undefined},
        );
        expect(result).toMatchObject({
            data: {
                storageGroupsCount: groupIds.length,
            },
        });
    });

    test('fetchStorageUsageData batches storage group requests for large tables', async () => {
        const totalGroups = storageGroupsBatchSize + 5;
        const groupIds = Array.from({length: totalGroups}, (_, index) => `2181038${index}`);
        const getStorageStats = jest.fn().mockResolvedValue({
            Paths: [
                {
                    Path: '/local/table',
                    FullPath: '/local/table',
                    StorageSize: totalGroups * 1000,
                    Groups: groupIds.map((groupId, index) => ({
                        GroupId: groupId,
                        StorageSize: (totalGroups - index) * 1000,
                        StorageCount: index + 1,
                    })),
                },
            ],
        });
        const getStorageGroups = jest.fn().mockImplementation(({groupId}: {groupId: string[]}) => {
            return Promise.resolve({
                StorageGroups: groupId.map((id, index) => ({
                    GroupId: id,
                    Limit: '10000',
                    PoolName: `pool-${index}`,
                    MediaType: 'SSD,Kind:0',
                    ErasureSpecies:
                        id === groupIds[storageGroupsBatchSize] ? 'mirror-3-dc' : 'none',
                })),
            });
        });

        window.api = {
            viewer: {getStorageStats},
            storage: {getStorageGroups},
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchStorageUsageData({
            path: '/local/table',
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(getStorageGroups).toHaveBeenCalledTimes(2);
        expect(getStorageGroups.mock.calls[0]?.[0]).toMatchObject({
            database: '/local',
            groupId: groupIds.slice(0, storageGroupsBatchSize),
            fieldsRequired: ['GroupId', 'Limit', 'PoolName', 'MediaType', 'Erasure'],
        });
        expect(getStorageGroups.mock.calls[1]?.[0]).toMatchObject({
            database: '/local',
            groupId: groupIds.slice(storageGroupsBatchSize),
            fieldsRequired: ['GroupId', 'Limit', 'PoolName', 'MediaType', 'Erasure'],
        });

        if (!('data' in result)) {
            throw new Error('Expected storage usage request to succeed for batched lookup');
        }

        expect(
            result.data.rows.find((row) => row.groupId === groupIds[storageGroupsBatchSize]),
        ).toMatchObject({
            erasure: 'mirror-3-dc',
            limit: 10000,
            mediaType: 'SSD',
        });
    });

    test('fetchStorageUsageData returns error when one storage groups batch fails', async () => {
        const storageGroupsError = new Error('storage groups batch failed');
        const totalGroups = storageGroupsBatchSize + 1;
        const groupIds = Array.from({length: totalGroups}, (_, index) => `3181038${index}`);
        const getStorageStats = jest.fn().mockResolvedValue({
            Paths: [
                {
                    Path: '/local/table',
                    FullPath: '/local/table',
                    StorageSize: totalGroups * 1000,
                    Groups: groupIds.map((groupId, index) => ({
                        GroupId: groupId,
                        StorageSize: (index + 1) * 1000,
                        StorageCount: index + 1,
                    })),
                },
            ],
        });
        const getStorageGroups = jest
            .fn()
            .mockResolvedValueOnce({
                StorageGroups: groupIds.slice(0, storageGroupsBatchSize).map((groupId) => ({
                    GroupId: groupId,
                    Limit: '10000',
                    MediaType: 'SSD,Kind:0',
                })),
            })
            .mockRejectedValueOnce(storageGroupsError);

        window.api = {
            viewer: {getStorageStats},
            storage: {getStorageGroups},
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchStorageUsageData({
            path: '/local/table',
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(getStorageGroups).toHaveBeenCalledTimes(2);
        expect(result).toEqual({error: storageGroupsError});
    });

    test('fetchStorageUsageData returns error when path stats do not match requested path', async () => {
        const getStorageStats = jest.fn().mockResolvedValue({
            Paths: [
                {
                    Path: 'other-table',
                    StorageSize: 4000,
                    Groups: [{GroupId: '2181038080', StorageSize: 1000, StorageCount: 10}],
                },
                {
                    Path: 'another-table',
                    StorageSize: 2000,
                    Groups: [{GroupId: '2181038081', StorageSize: 2000, StorageCount: 20}],
                },
            ],
        });
        const getStorageGroups = jest.fn();

        window.api = {
            viewer: {getStorageStats},
            storage: {getStorageGroups},
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchStorageUsageData({
            path: '/local/requested-table',
            database: '/local',
            databaseFullPath: '/local',
            useMetaProxy: true,
        });

        expect(getStorageStats).toHaveBeenCalledTimes(1);
        expect(getStorageGroups).not.toHaveBeenCalled();
        expect(result).toMatchObject({error: expect.any(Error)});

        if ('error' in result && result.error instanceof Error) {
            expect(result.error.message).toBe(
                'Storage stats path entry was not found for "/local/requested-table"',
            );
        } else {
            throw new Error('Expected storage usage request to fail when path stats are missing');
        }
    });

    test('buildStorageUsageSections uses explicit per-media stats for mixed-media sections', () => {
        const sections = buildStorageUsageSections(
            [
                {
                    groupId: '1',
                    used: 300,
                    share: 0.6,
                    storageCount: 3,
                    mediaType: 'SSD',
                },
                {
                    groupId: '2',
                    used: 100,
                    share: 0.2,
                    storageCount: 1,
                    mediaType: 'HDD',
                },
                {
                    groupId: '3',
                    used: 100,
                    share: 0.2,
                    storageCount: 2,
                    mediaType: 'SSD',
                },
            ],
            1000,
            500,
            {
                SSD: {
                    dataSize: 50,
                    diskUsage: 400,
                },
                HDD: {
                    dataSize: 25,
                    diskUsage: 100,
                },
            },
        );

        expect(sections).toEqual([
            {
                mediaKey: 'SSD',
                mediaLabel: 'SSD',
                dataSize: 50,
                diskUsage: 400,
                overhead: 8,
                storageGroupsCount: 2,
                rows: [
                    {
                        groupId: '1',
                        used: 300,
                        share: 0.6,
                        storageCount: 3,
                        mediaType: 'SSD',
                    },
                    {
                        groupId: '3',
                        used: 100,
                        share: 0.2,
                        storageCount: 2,
                        mediaType: 'SSD',
                    },
                ],
            },
            {
                mediaKey: 'HDD',
                mediaLabel: 'HDD',
                dataSize: 25,
                diskUsage: 100,
                overhead: 4,
                storageGroupsCount: 1,
                rows: [
                    {
                        groupId: '2',
                        used: 100,
                        share: 0.2,
                        storageCount: 1,
                        mediaType: 'HDD',
                    },
                ],
            },
        ]);
    });

    test('buildStorageUsageSections leaves mixed-media data size and overhead empty without per-media data size', () => {
        const sections = buildStorageUsageSections(
            [
                {
                    groupId: '1',
                    used: 300,
                    share: 0.6,
                    storageCount: 3,
                    mediaType: 'SSD',
                },
                {
                    groupId: '2',
                    used: 200,
                    share: 0.4,
                    storageCount: 1,
                    mediaType: 'HDD',
                },
            ],
            1000,
            500,
            {
                SSD: {
                    diskUsage: 300,
                },
                HDD: {
                    diskUsage: 200,
                },
            },
        );

        expect(sections).toEqual([
            {
                mediaKey: 'SSD',
                mediaLabel: 'SSD',
                dataSize: undefined,
                diskUsage: 300,
                overhead: undefined,
                storageGroupsCount: 1,
                rows: [
                    {
                        groupId: '1',
                        used: 300,
                        share: 0.6,
                        storageCount: 3,
                        mediaType: 'SSD',
                    },
                ],
            },
            {
                mediaKey: 'HDD',
                mediaLabel: 'HDD',
                dataSize: undefined,
                diskUsage: 200,
                overhead: undefined,
                storageGroupsCount: 1,
                rows: [
                    {
                        groupId: '2',
                        used: 200,
                        share: 0.4,
                        storageCount: 1,
                        mediaType: 'HDD',
                    },
                ],
            },
        ]);
    });

    test('buildStorageUsageSections falls back to overall table stats for single-media sections', () => {
        const sections = buildStorageUsageSections(
            [
                {
                    groupId: '1',
                    used: 1500,
                    share: 0.5,
                    storageCount: 3,
                    mediaType: 'SSD',
                },
            ],
            1000,
            3000,
        );

        expect(sections).toEqual([
            {
                mediaKey: 'SSD',
                mediaLabel: 'SSD',
                dataSize: 1000,
                diskUsage: 3000,
                overhead: 3,
                storageGroupsCount: 1,
                rows: [
                    {
                        groupId: '1',
                        used: 1500,
                        share: 0.5,
                        storageCount: 3,
                        mediaType: 'SSD',
                    },
                ],
            },
        ]);
    });
});
