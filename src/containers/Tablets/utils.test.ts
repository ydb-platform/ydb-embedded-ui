import {EType} from '../../types/api/tablet';

import {filterTablets, getAvailableTabletTypes} from './utils';

const tablets = [
    {TabletId: '101', Type: EType.DataShard},
    {TabletId: '102', Type: EType.Hive},
    {TabletId: '210', Type: EType.ColumnShard},
    {TabletId: '103'},
    {TabletId: '104', Type: 'Future_Shard'},
];

describe('filterTablets', () => {
    test('combines the tablet ID search with the selected tablet types', () => {
        expect(
            filterTablets(tablets, {
                tabletIdSearch: '10',
                tabletTypes: [EType.DataShard, EType.Hive],
            }),
        ).toEqual([tablets[0], tablets[1]]);
    });
});

describe('getAvailableTabletTypes', () => {
    test('returns unique sorted response and selected tablet types', () => {
        expect(getAvailableTabletTypes(tablets, [EType.Hive])).toEqual([
            EType.ColumnShard,
            EType.DataShard,
            'Future_Shard',
            EType.Hive,
        ]);
    });
});
