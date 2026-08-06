import type {TTenantResource} from '../../../../../../types/api/tenant';
import {getAllocatedStorageGroups} from '../TenantStorageGroups';

function resource({
    Count,
    Kind,
    Type = 'storage',
}: Pick<TTenantResource, 'Count' | 'Kind'> &
    Partial<Pick<TTenantResource, 'Type'>>): TTenantResource {
    return {Count, Kind, Type, Zone: ''};
}

test('keeps allocated storage groups in backend order without aggregation', () => {
    expect(
        getAllocatedStorageGroups([
            resource({Kind: 'ssdmirror', Count: 20}),
            resource({Kind: 'compute', Count: 8, Type: 'compute'}),
            resource({Kind: 'ssd', Count: 174}),
            resource({Kind: 'ssd', Count: 6}),
        ]),
    ).toEqual([
        {kind: 'ssdmirror', count: 20},
        {kind: 'ssd', count: 174},
        {kind: 'ssd', count: 6},
    ]);
});

test('ignores allocated resources with invalid group values', () => {
    expect(
        getAllocatedStorageGroups([
            resource({Kind: '', Count: 1}),
            resource({Kind: 'negative', Count: -1}),
            resource({Kind: 'not-a-number', Count: Number.NaN}),
            resource({Kind: 'zero', Count: 0}),
        ]),
    ).toEqual([{kind: 'zero', count: 0}]);
});

test('returns an empty list when allocated resources are absent', () => {
    expect(getAllocatedStorageGroups(undefined)).toEqual([]);
});
