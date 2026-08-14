import {getTabletObjectKey} from '../utils';

describe('getTabletObjectKey', () => {
    test('returns the SchemeShard and object path identifiers for the requested tablet', () => {
        expect(
            getTabletObjectKey(
                {
                    Tablets: [
                        {
                            TabletID: '101',
                            TabletOwner: {Owner: '42'},
                            ObjectId: '99',
                        },
                    ],
                },
                '101',
            ),
        ).toEqual({SchemeShard: '42', PathId: '99'});
    });

    test.each([
        [{Tablets: []}, '101'],
        [{Tablets: [{TabletID: '102', TabletOwner: {Owner: '42'}, ObjectId: '99'}]}, '101'],
        [{Tablets: [{TabletID: '101', ObjectId: '99'}]}, '101'],
        [{Tablets: [{TabletID: '101', TabletOwner: {Owner: '42'}, ObjectId: '0'}]}, '101'],
    ])('returns undefined for incomplete or unrelated Hive data', (data, tabletId) => {
        expect(getTabletObjectKey(data, tabletId)).toBeUndefined();
    });
});
