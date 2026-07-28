import {buildSplitPointEntries} from '../sections/SplitPointDialog';
import type {ColumnField} from '../types';

describe('SplitPointDialog', () => {
    test('preserves saved isDefined flag for autoincrement split points', () => {
        const pkColumns: ColumnField[] = [
            {
                _id: 'column-id',
                name: 'id',
                type: 'Int64',
                key: true,
                notNull: true,
                autoincrement: true,
                withDefaultValue: false,
            },
        ];

        const [entry] = buildSplitPointEntries(pkColumns, [
            {
                id: 'split-point-id',
                name: 'id',
                type: 'Int64',
                key: true,
                notNull: true,
                autoincrement: true,
                isDefined: true,
                value: '42',
            },
        ]);

        expect(entry.isDefined).toBe(true);
        expect(entry.value).toBe('42');
    });
});
