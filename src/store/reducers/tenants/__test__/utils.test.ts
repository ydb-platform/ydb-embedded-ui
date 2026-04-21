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
});
