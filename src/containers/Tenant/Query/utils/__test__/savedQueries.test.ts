import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {
    filterSavedQueries,
    formatSavedQueryUpdatedAt,
    getSavedQueriesSizeError,
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
        status: 'renamed',
        queries: [
            {name: 'Daily report', body: 'SELECT * FROM weekly;', updatedAt: 500},
            queries[1],
        ],
    });
    expect(renameSavedQueryInList(queries, 'missing', 'Other', 500)).toEqual({
        status: 'not-found',
        queries,
    });
});

test('returns duplicate without changing saved queries', () => {
    expect(renameSavedQueryInList(queries, 'Weekly report', ' capacity ', 500)).toEqual({
        status: 'duplicate',
        queries,
    });
});

test('detects duplicate names against legacy whitespace-normalized records', () => {
    const legacyQuery = {name: ' Report ', body: 'SELECT 1;', updatedAt: 100};

    expect(hasSavedQueryName([legacyQuery], 'report')).toBe(true);
    expect(hasSavedQueryNameCollision([legacyQuery], 'Another query', 'report')).toBe(true);
    expect(hasSavedQueryNameCollision([legacyQuery], ' Report ', 'report')).toBe(false);
});

test('updates and renames the exact legacy duplicate selected by name', () => {
    const legacyQueries = [
        {name: ' Report ', body: 'SELECT 1;', updatedAt: 100},
        {name: 'Report', body: 'SELECT 2;', updatedAt: 200},
    ];

    expect(upsertSavedQuery(legacyQueries, 'Report', 'SELECT 3;', 300)).toEqual([
        legacyQueries[0],
        {name: 'Report', body: 'SELECT 3;', updatedAt: 300},
    ]);
    expect(renameSavedQueryInList(legacyQueries, 'Report', 'Summary', 300)).toEqual({
        status: 'renamed',
        queries: [legacyQueries[0], {name: 'Summary', body: 'SELECT 2;', updatedAt: 300}],
    });
});

test('does not exempt another legacy duplicate from collision validation', () => {
    const legacyQueries = [
        {name: ' Report ', body: 'SELECT 1;', updatedAt: 100},
        {name: 'Report', body: 'SELECT 2;', updatedAt: 200},
    ];

    expect(hasSavedQueryNameCollision(legacyQueries, 'Report', ' Report ')).toBe(true);
    expect(hasSavedQueryNameCollision(legacyQueries, 'Report', 'Report')).toBe(false);
});

test.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, 0, -1])(
    'renders an invalid timestamp as the shared placeholder',
    (updatedAt) => expect(formatSavedQueryUpdatedAt(updatedAt)).toBe(EMPTY_DATA_PLACEHOLDER),
);

test('reports a query that exceeds 16 MiB by itself after JSON escaping', () => {
    const query = {name: 'Large query', body: '\\'.repeat(4 * 1024 * 1024), updatedAt: 300};

    expect(getSavedQueriesSizeError([query], query.name)).toBe('query-too-large');
});

test('reports a full list when the new query fits by itself', () => {
    const existing = {name: 'Existing query', body: '\\'.repeat(2_100_000), updatedAt: 100};
    const candidate = {name: 'New query', body: '\\'.repeat(2_100_000), updatedAt: 300};

    expect(getSavedQueriesSizeError([existing, candidate], candidate.name)).toBe('list-full');
    expect(getSavedQueriesSizeError([candidate], candidate.name)).toBeUndefined();
});

test('checks the resulting list when replacing an existing query', () => {
    const existing = {name: 'Existing query', body: '\\'.repeat(4_193_000), updatedAt: 100};
    const replacement = upsertSavedQuery([existing], existing.name, '\\'.repeat(2000), 300);

    expect(getSavedQueriesSizeError(replacement, existing.name)).toBeUndefined();
});
