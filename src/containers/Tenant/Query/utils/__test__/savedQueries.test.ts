import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {
    filterSavedQueries,
    formatSavedQueryUpdatedAt,
    hasSavedQueryName,
    hasSavedQueryNameCollision,
    renameSavedQueryInList,
    upsertSavedQuery,
} from '../savedQueries';

const queries = [
    {name: 'Weekly report', body: 'SELECT * FROM weekly;', updatedAt: 100},
    {name: 'Capacity', body: 'SELECT used_bytes FROM storage;', updatedAt: 200},
];

test('filters by name and body case-insensitively', () => {
    expect(filterSavedQueries(queries, 'WEEKLY')).toEqual([queries[0]]);
    expect(filterSavedQueries(queries, 'used_BYTES')).toEqual([queries[1]]);
});

test('upserts body and timestamp without moving an existing row', () => {
    expect(upsertSavedQuery(queries, 'weekly REPORT', 'SELECT 2;', 400)).toEqual([
        {name: 'Weekly report', body: 'SELECT 2;', updatedAt: 400},
        queries[1],
    ]);
});

test('renames an existing query and leaves a missing source unchanged', () => {
    expect(renameSavedQueryInList(queries, 'weekly REPORT', 'Daily report', 500)).toEqual({
        renamed: true,
        queries: [
            {name: 'Daily report', body: 'SELECT * FROM weekly;', updatedAt: 500},
            queries[1],
        ],
    });
    expect(renameSavedQueryInList(queries, 'missing', 'Other', 500)).toEqual({
        renamed: false,
        queries,
    });
});

test('detects duplicate names against legacy whitespace-normalized records', () => {
    const legacyQuery = {name: ' Report ', body: 'SELECT 1;', updatedAt: 100};

    expect(hasSavedQueryName([legacyQuery], 'report')).toBe(true);
    expect(hasSavedQueryNameCollision([legacyQuery], 'Another query', 'report')).toBe(true);
    expect(hasSavedQueryNameCollision([legacyQuery], ' Report ', 'report')).toBe(false);
});

test.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, 0, -1])(
    'renders an invalid timestamp as the shared placeholder',
    (updatedAt) => expect(formatSavedQueryUpdatedAt(updatedAt)).toBe(EMPTY_DATA_PLACEHOLDER),
);
