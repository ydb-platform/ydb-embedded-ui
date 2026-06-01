import type {YdbEmbeddedAPI} from '../../../../../services/api';
import {EStorageStatsProblem} from '../../../../../types/api/storage';
import {fetchTenantStorageRawData} from '../tenantOverviewStorage';

function createTopRowsQueryResponse(rows: Array<[string, number | string]>) {
    return {
        result: [
            {
                columns: [
                    {name: 'Path', type: 'Utf8?'},
                    {name: 'UserData', type: 'Uint64?'},
                ],
                rows,
            },
        ],
    };
}

describe('fetchTenantStorageRawData', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('returns summaries with empty top rows when partition stats query fails', async () => {
        const tabletTypeRows = [
            {
                Type: 'DataShard',
                StorageSize: 100,
                Media: [{Kind: 'SSD', StorageSize: 100}],
            },
        ];
        const getStorageStats = jest.fn().mockResolvedValue({Tablets: tabletTypeRows});
        const getSchema = jest.fn().mockResolvedValue({
            Path: '/local',
            PathDescription: {
                DomainDescription: {
                    DiskSpaceUsage: {
                        Tables: {DataSize: '120'},
                        Topics: {DataSize: '30'},
                    },
                },
                Children: [],
            },
        });
        const topRowsError = new Error('partition stats unavailable');
        const sendQuery = jest.fn().mockRejectedValue(topRowsError);

        window.api = {
            viewer: {
                getStorageStats,
                getSchema,
                sendQuery,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchTenantStorageRawData({
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(result).toEqual({
            logicalUserData: {
                rowTables: 120,
                topics: 30,
            },
            problems: [],
            topRows: [],
            topRowsError,
            tabletTypeRows,
        });
        expect(getStorageStats).toHaveBeenCalledTimes(1);
        expect(getSchema).toHaveBeenCalledTimes(1);
        expect(sendQuery).toHaveBeenCalledTimes(1);
    });

    test('keeps partial logical user data without converting missing fields to zero', async () => {
        const getStorageStats = jest.fn().mockResolvedValue({Tablets: []});
        const getSchema = jest.fn().mockResolvedValue({
            Path: '/local',
            PathDescription: {
                DomainDescription: {
                    DiskSpaceUsage: {
                        Tables: {DataSize: '120'},
                        Topics: {},
                    },
                },
                Children: [],
            },
        });
        const sendQuery = jest.fn().mockResolvedValue(createTopRowsQueryResponse([]));

        window.api = {
            viewer: {
                getStorageStats,
                getSchema,
                sendQuery,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchTenantStorageRawData({
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(result.logicalUserData).toEqual({
            rowTables: 120,
            topics: undefined,
        });
    });

    test('treats empty logical data size as unknown', async () => {
        const getStorageStats = jest.fn().mockResolvedValue({Tablets: []});
        const getSchema = jest.fn().mockResolvedValue({
            Path: '/local',
            PathDescription: {
                DomainDescription: {
                    DiskSpaceUsage: {
                        Tables: {DataSize: '120'},
                        Topics: {DataSize: ''},
                    },
                },
                Children: [],
            },
        });
        const sendQuery = jest.fn().mockResolvedValue(createTopRowsQueryResponse([]));

        window.api = {
            viewer: {
                getStorageStats,
                getSchema,
                sendQuery,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchTenantStorageRawData({
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(result.logicalUserData).toEqual({
            rowTables: 120,
            topics: undefined,
        });
    });

    test('keeps zero logical data size when the field is present', async () => {
        const getStorageStats = jest.fn().mockResolvedValue({Tablets: []});
        const getSchema = jest.fn().mockResolvedValue({
            Path: '/local',
            PathDescription: {
                DomainDescription: {
                    DiskSpaceUsage: {
                        Tables: {DataSize: '120'},
                        Topics: {DataSize: '0'},
                    },
                },
                Children: [],
            },
        });
        const sendQuery = jest.fn().mockResolvedValue(createTopRowsQueryResponse([]));

        window.api = {
            viewer: {
                getStorageStats,
                getSchema,
                sendQuery,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchTenantStorageRawData({
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(result.logicalUserData).toEqual({
            rowTables: 120,
            topics: 0,
        });
    });

    test('keeps top rows when secondary storage stats request fails', async () => {
        const tabletTypeRows = [
            {
                Type: 'DataShard',
                StorageSize: 100,
                Media: [{Kind: 'SSD', StorageSize: 100}],
            },
        ];
        const storageStatsError = new Error('storage stats unavailable');
        const getStorageStats = jest
            .fn()
            .mockResolvedValueOnce({Tablets: tabletTypeRows})
            .mockRejectedValueOnce(storageStatsError);
        const getSchema = jest.fn().mockResolvedValue({
            Path: '/local',
            PathDescription: {
                DomainDescription: {
                    DiskSpaceUsage: {
                        Tables: {DataSize: '120'},
                        Topics: {DataSize: '30'},
                    },
                },
                Children: [
                    {
                        Name: 'table-a',
                        PathType: 'EPathTypeTable',
                    },
                ],
            },
        });
        const sendQuery = jest
            .fn()
            .mockResolvedValue(createTopRowsQueryResponse([['/local/table-a', '100']]));

        window.api = {
            viewer: {
                getStorageStats,
                getSchema,
                sendQuery,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchTenantStorageRawData({
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(result.topRows).toEqual([
            {
                path: '/local/table-a',
                userData: 100,
                physicalDisk: undefined,
                pathType: 'EPathTypeTable',
                pathSubType: undefined,
            },
        ]);
        expect(result.topRowsError).toBe(storageStatsError);
        expect(result.tabletTypeRows).toBe(tabletTypeRows);
        expect(getStorageStats).toHaveBeenCalledTimes(2);
        expect(getSchema).toHaveBeenCalledTimes(1);
        expect(sendQuery).toHaveBeenCalledTimes(1);
        expect(sendQuery.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({
                query: expect.stringMatching(/WHERE\s+TabletId != 0\s+GROUP BY Path/),
            }),
        );
    });

    test('returns merged storage stats problems from successful responses', async () => {
        const getStorageStats = jest
            .fn()
            .mockResolvedValueOnce({
                Problems: [EStorageStatsProblem.DataIncomplete],
                Tablets: [],
            })
            .mockResolvedValueOnce({
                Paths: [{FullPath: '/local/table-a', StorageSize: 300}],
                Problems: [EStorageStatsProblem.DataIncomplete, 'secondary-problem'],
            });
        const getSchema = jest.fn().mockResolvedValue({
            Path: '/local',
            PathDescription: {
                Children: [
                    {
                        Name: 'table-a',
                        PathType: 'EPathTypeTable',
                    },
                ],
            },
        });
        const sendQuery = jest
            .fn()
            .mockResolvedValue(createTopRowsQueryResponse([['/local/table-a', 100]]));

        window.api = {
            viewer: {
                getStorageStats,
                getSchema,
                sendQuery,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchTenantStorageRawData({
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(result.problems).toEqual([EStorageStatsProblem.DataIncomplete, 'secondary-problem']);
        expect(getStorageStats).toHaveBeenCalledTimes(2);
    });

    test('keeps top rows and surfaces schema enrichment errors', async () => {
        const schemaError = new Error('schema unavailable');
        const getStorageStats = jest
            .fn()
            .mockResolvedValueOnce({Tablets: []})
            .mockResolvedValueOnce({
                Paths: [{FullPath: '/local/table-a', StorageSize: 300}],
            });
        const getSchema = jest
            .fn()
            .mockResolvedValueOnce({
                Path: '/local',
                PathDescription: {
                    DomainDescription: {
                        DiskSpaceUsage: {
                            Tables: {DataSize: '120'},
                            Topics: {DataSize: '30'},
                        },
                    },
                    Children: [],
                },
            })
            .mockRejectedValueOnce(schemaError);
        const sendQuery = jest
            .fn()
            .mockResolvedValue(createTopRowsQueryResponse([['/local/table-a', 100]]));

        window.api = {
            viewer: {
                getStorageStats,
                getSchema,
                sendQuery,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchTenantStorageRawData({
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(result.topRows).toEqual([
            {
                path: '/local/table-a',
                userData: 100,
                physicalDisk: 300,
            },
        ]);
        expect(result.topRowsError).toBe(schemaError);
        expect(getStorageStats).toHaveBeenCalledTimes(2);
        expect(getSchema).toHaveBeenCalledTimes(2);
        expect(sendQuery).toHaveBeenCalledTimes(1);
    });

    test('keeps summary data and surfaces error when tablet type stats request fails', async () => {
        const tabletTypeError = new Error('tablet type stats unavailable');
        const getStorageStats = jest
            .fn()
            .mockRejectedValueOnce(tabletTypeError)
            .mockResolvedValueOnce({
                Paths: [{FullPath: '/local/table-a', StorageSize: 300}],
            });
        const getSchema = jest.fn().mockResolvedValue({
            Path: '/local',
            PathDescription: {
                DomainDescription: {
                    DiskSpaceUsage: {
                        Tables: {DataSize: '120'},
                        Topics: {DataSize: '30'},
                    },
                },
                Children: [
                    {
                        Name: 'table-a',
                        PathType: 'EPathTypeTable',
                    },
                ],
            },
        });
        const sendQuery = jest
            .fn()
            .mockResolvedValue(createTopRowsQueryResponse([['/local/table-a', 100]]));

        window.api = {
            viewer: {
                getStorageStats,
                getSchema,
                sendQuery,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await fetchTenantStorageRawData({
            database: '/local',
            databaseFullPath: '/local',
        });

        expect(result).toEqual({
            logicalUserData: {
                rowTables: 120,
                topics: 30,
            },
            problems: [],
            topRows: [
                {
                    path: '/local/table-a',
                    userData: 100,
                    physicalDisk: 300,
                    pathType: 'EPathTypeTable',
                    pathSubType: undefined,
                },
            ],
            topRowsError: tabletTypeError,
            tabletTypeRows: [],
        });
        expect(getStorageStats).toHaveBeenCalledTimes(2);
        expect(getSchema).toHaveBeenCalledTimes(1);
        expect(sendQuery).toHaveBeenCalledTimes(1);
    });
});
