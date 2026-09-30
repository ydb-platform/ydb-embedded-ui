import {SYS_VIEW_TYPE_IDS} from '../../types/api/schema/sysView';
import {prepareSystemViewType} from '../schema';

describe('prepareSystemViewType', () => {
    test('strips the E prefix from enum names returned by YDB <= 26.3.1.x', () => {
        expect(prepareSystemViewType('EVSlots')).toBe('VSlots');
        expect(prepareSystemViewType('EPartitionStats')).toBe('PartitionStats');
    });

    // Keep expectations independent of SYS_VIEW_TYPE_IDS, using this backend enum snapshot:
    // https://github.com/ydb-platform/ydb/blob/51c35c967b050c2f52ab8efa5c547cf1882f7998/ydb/core/protos/sys_view_types.proto
    test.each([
        [1, 'PartitionStats'],
        [2, 'Nodes'],
        [3, 'TopQueriesByDurationOneMinute'],
        [4, 'TopQueriesByDurationOneHour'],
        [5, 'TopQueriesByReadBytesOneMinute'],
        [6, 'TopQueriesByReadBytesOneHour'],
        [7, 'TopQueriesByCpuTimeOneMinute'],
        [8, 'TopQueriesByCpuTimeOneHour'],
        [9, 'TopQueriesByRequestUnitsOneMinute'],
        [10, 'TopQueriesByRequestUnitsOneHour'],
        [11, 'QuerySessions'],
        [12, 'PDisks'],
        [13, 'VSlots'],
        [14, 'Groups'],
        [15, 'StoragePools'],
        [16, 'StorageStats'],
        [17, 'Tablets'],
        [18, 'QueryMetricsOneMinute'],
        [19, 'TopPartitionsByCpuOneMinute'],
        [20, 'TopPartitionsByCpuOneHour'],
        [21, 'TopPartitionsByTliOneMinute'],
        [22, 'TopPartitionsByTliOneHour'],
        [23, 'ResourcePoolClassifiers'],
        [24, 'ResourcePools'],
        [25, 'AuthUsers'],
        [26, 'AuthGroups'],
        [27, 'AuthGroupMembers'],
        [28, 'AuthOwners'],
        [29, 'AuthPermissions'],
        [30, 'AuthEffectivePermissions'],
        [31, 'PgTables'],
        [32, 'InformationSchemaTables'],
        [33, 'PgClass'],
        [34, 'ShowCreate'],
        [35, 'CompileCacheQueries'],
        [36, 'StorePrimaryIndexStats'],
        [37, 'StorePrimaryIndexSchemaStats'],
        [38, 'StorePrimaryIndexPortionStats'],
        [39, 'StorePrimaryIndexGranuleStats'],
        [40, 'StorePrimaryIndexOptimizerStats'],
        [41, 'TablePrimaryIndexStats'],
        [42, 'TablePrimaryIndexSchemaStats'],
        [43, 'TablePrimaryIndexPortionStats'],
        [44, 'TablePrimaryIndexGranuleStats'],
        [45, 'TablePrimaryIndexOptimizerStats'],
        [46, 'StreamingQueries'],
        [47, 'UdfModules'],
    ])('maps numeric type %i to %s', (type, expectedName) => {
        expect(prepareSystemViewType(type)).toBe(expectedName);
    });

    test('falls back to the raw value for numbers unknown to the UI', () => {
        expect(prepareSystemViewType(9999)).toBe('9999');
        expect(prepareSystemViewType(0)).toBe('0');
    });

    test('returns undefined for missing values', () => {
        expect(prepareSystemViewType(undefined)).toBeUndefined();
        expect(prepareSystemViewType(null)).toBeUndefined();
        expect(prepareSystemViewType('')).toBeUndefined();
    });

    test('keeps strings without the E prefix unchanged', () => {
        expect(prepareSystemViewType('CustomView')).toBe('CustomView');
    });
});

describe('SYS_VIEW_TYPE_IDS', () => {
    test('ids are unique', () => {
        const ids = Object.values(SYS_VIEW_TYPE_IDS);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
