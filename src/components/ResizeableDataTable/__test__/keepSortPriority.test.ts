import type {SortOrder} from '@gravity-ui/react-data-table';

import {keepSortPriority} from '../keepSortPriority';

const desc = (columnId: string): SortOrder => ({columnId, order: -1});

describe('keepSortPriority', () => {
    test('adds new columns after the already sorted ones', () => {
        expect(keepSortPriority(desc('a'), [desc('c'), desc('a'), desc('b')])).toEqual([
            desc('a'),
            desc('c'),
            desc('b'),
        ]);
    });

    test('drops columns that are no longer sorted', () => {
        expect(keepSortPriority([desc('a'), desc('b'), desc('c')], [desc('c'), desc('a')])).toEqual(
            [desc('a'), desc('c')],
        );
    });

    test('passes a single-column sort and a reset through', () => {
        expect(keepSortPriority([desc('a'), desc('b')], [desc('c')])).toEqual([desc('c')]);
        expect(keepSortPriority([desc('a')], undefined)).toBeUndefined();
        expect(keepSortPriority(undefined, [desc('b'), desc('a')])).toEqual([desc('b'), desc('a')]);
    });
});
