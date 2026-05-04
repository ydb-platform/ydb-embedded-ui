import {EType} from '../../../../types/api/tenant';
import {calculateTenantMetrics} from '../utils';

describe('calculateTenantMetrics', () => {
    test('normalizes invalid storage sizes and limits', () => {
        const result = calculateTenantMetrics({
            DatabaseStorage: [{Type: EType.SSD}, {Type: EType.HDD, Size: '200', Limit: 'invalid'}],
            DatabaseQuotas: {
                storage_quotas: [{unit_kind: EType.HDD, data_size_soft_quota: '800'}],
            },
            TablesStorage: [
                {Type: EType.SSD, Size: 'invalid', Limit: 'invalid'},
                {Type: EType.HDD, Size: '100', Limit: '300', SoftQuota: 'invalid'},
            ],
        });

        expect(result.blobStorageStats).toEqual([
            {name: EType.SSD, used: 0, limit: undefined, usage: undefined},
            {name: EType.HDD, used: 200, limit: undefined, usage: undefined},
        ]);
        expect(result.tabletStorageStats).toEqual([
            {name: EType.SSD, used: 0, limit: undefined, usage: undefined},
            {name: EType.HDD, used: 100, limit: 800, usage: 12.5},
        ]);
    });

    test('uses per-media storage quotas when table storage limit is missing', () => {
        const result = calculateTenantMetrics({
            DatabaseQuotas: {
                data_size_soft_quota: '612032839680',
                storage_quotas: [
                    {unit_kind: 'ssd', data_size_soft_quota: '306016419840'},
                    {unit_kind: 'hdd', data_size_soft_quota: '2089072092774'},
                ],
            },
            DatabaseStorage: [
                {Type: EType.HDD, Size: '1353743073280', Limit: '17999012094860'},
                {Type: EType.SSD, Size: '98419343360', Limit: '1873981472766'},
            ],
            TablesStorage: [
                {
                    Type: EType.HDD,
                    Size: '289166965049',
                    Limit: '612032839680',
                    SoftQuota: '612032839680',
                },
                {Type: EType.SSD, Size: '986'},
            ],
        });

        expect(result.tabletStorageStats).toEqual([
            {
                name: EType.HDD,
                used: 289166965049,
                limit: 612032839680,
                usage: expect.any(Number),
            },
            {name: EType.SSD, used: 986, limit: 306016419840, usage: expect.any(Number)},
        ]);
        expect(result.tabletStorageStats?.[0]?.usage).toBeCloseTo(47.247);
        expect(result.tabletStorageStats?.[1]?.usage).toBeCloseTo(0.000000322);
    });
});
