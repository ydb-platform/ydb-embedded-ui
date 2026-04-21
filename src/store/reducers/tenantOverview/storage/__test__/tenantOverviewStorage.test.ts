import type {YdbEmbeddedAPI} from '../../../../../services/api';
import {fetchTenantStorageRawData} from '../tenantOverviewStorage';

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
            topRows: [],
            topRowsError,
            tabletTypeRows,
        });
        expect(getStorageStats).toHaveBeenCalledTimes(1);
        expect(getSchema).toHaveBeenCalledTimes(1);
        expect(sendQuery).toHaveBeenCalledTimes(1);
    });
});
