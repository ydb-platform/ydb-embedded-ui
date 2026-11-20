import {appendQueryToHistory, limitQueryHistory} from '../historyLimits';

function requestBodyBytes(history: unknown[]) {
    return new TextEncoder().encode(JSON.stringify(JSON.stringify(history))).byteLength;
}

describe('query history size limits', () => {
    it('skips a large new query without changing the previous history', () => {
        const history = [{queryText: 'SELECT 1;', queryId: 'old'}];
        const query = {queryText: 'a'.repeat(839_000), queryId: 'new'};

        expect(appendQueryToHistory(history, query)).toBeUndefined();
        expect(history).toEqual([{queryText: 'SELECT 1;', queryId: 'old'}]);
    });

    it('accounts for UTF-8 and both layers of JSON escaping', () => {
        const query = {queryText: 'я"\n'.repeat(100_000), queryId: 'new'};
        expect(query.queryText.length).toBeLessThan(838_000);
        expect(requestBodyBytes([query])).toBeGreaterThan(839_000);
        expect(appendQueryToHistory([], query)).toBeUndefined();
    });

    it('keeps the 20 most recent large but admissible queries', () => {
        const queryText = 'a'.repeat(838_800);
        const history = Array.from({length: 20}, (_, index) => ({
            queryText,
            queryId: String(index),
        }));
        const nextHistory = appendQueryToHistory(history, {queryText, queryId: '20'});

        expect(nextHistory?.map(({queryId}) => queryId)).toEqual(
            Array.from({length: 20}, (_, index) => String(index + 1)),
        );
        expect(requestBodyBytes(nextHistory ?? [])).toBeLessThanOrEqual(16 * 1024 * 1024);
    });

    it.each([2000, 900])(
        'keeps a rerun with start time %i when updated statistics overflow the history',
        (startTime) => {
            const queryText = 'a'.repeat(838_000);
            const history = Array.from({length: 20}, (_, index) => ({
                queryText,
                queryId: String(index),
                startTime: 1000 + index,
            }));
            const lastQuery = history[19];
            const remainingBytes = 16 * 1024 * 1024 - requestBodyBytes(history) - 13;
            lastQuery.queryText += ' '.repeat(remainingBytes);

            expect(requestBodyBytes(history)).toBe(16 * 1024 * 1024 - 13);

            const rerun = {...history[0], startTime, durationUs: 123456, status: 'completed'};
            const limited = limitQueryHistory([rerun, ...history.slice(1)], rerun);

            const keptQueryIds = history.slice(2).map(({queryId}) => queryId);
            expect(limited.map(({queryId}) => queryId)).toEqual(
                startTime === 900
                    ? [rerun.queryId, ...keptQueryIds]
                    : [...keptQueryIds, rerun.queryId],
            );
            expect(requestBodyBytes(limited)).toBeLessThanOrEqual(16 * 1024 * 1024);
        },
    );

    it('evicts the oldest entries when legacy history exceeds the total limit', () => {
        const legacyQuery = 'a'.repeat(16 * 1024 * 1024 - 1000);
        const newQuery = {queryText: 'a'.repeat(2000), queryId: 'new'};

        const history = limitQueryHistory([legacyQuery, newQuery]);
        expect(history).toHaveLength(1);
        expect(history.at(-1)).toBe(newQuery);
    });
});
