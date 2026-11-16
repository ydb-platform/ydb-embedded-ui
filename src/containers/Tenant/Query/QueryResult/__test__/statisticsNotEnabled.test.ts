import type {QueryResult} from '../../../../../store/reducers/query/types';
import {isStatisticsNotEnabled} from '../utils';

const result: QueryResult = {
    executionId: '1',
    queryId: '1',
    type: 'execute',
    statisticsMode: 'none',
    isLoading: false,
    endTime: 10,
};

test('recognizes missing statistics only for a completed Run with None', () => {
    expect(isStatisticsNotEnabled(result)).toBe(true);
    expect(isStatisticsNotEnabled({...result, data: {}})).toBe(true);
});

test.each([
    {statisticsMode: undefined},
    {statisticsMode: 'basic'},
    {statisticsMode: 'full'},
    {statisticsMode: 'profile'},
    {type: 'explain'},
    {type: 'explain-analyze'},
    {isLoading: true},
    {endTime: undefined},
    {streamingStatus: 'running'},
    {error: 'failed'},
    {data: {stats: {}}},
] as Partial<QueryResult>[])('does not call statistics disabled for %j', (patch) => {
    expect(isStatisticsNotEnabled({...result, ...patch})).toBe(false);
});
