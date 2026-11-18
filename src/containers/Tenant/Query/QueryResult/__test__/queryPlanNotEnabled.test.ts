import type {QueryResult} from '../../../../../store/reducers/query/types';
import {isQueryPlanNotEnabled} from '../utils';

const result: QueryResult = {
    executionId: '1',
    queryId: '1',
    type: 'execute',
    statisticsMode: 'basic',
    isLoading: false,
    endTime: 10,
};

test.each(['none', 'basic'] as const)(
    'recognizes completed Run with %s and no plan',
    (statisticsMode) => {
        expect(isQueryPlanNotEnabled({...result, statisticsMode})).toBe(true);
    },
);
test.each([
    {statisticsMode: undefined},
    {statisticsMode: 'full'},
    {statisticsMode: 'profile'},
    {type: 'explain'},
    {type: 'explain-analyze'},
    {isLoading: true},
    {endTime: undefined},
    {error: 'failed'},
    {streamingStatus: 'progress'},
    {data: {plan: {meta: {type: 'query', version: '0.2'}}}},
    {data: {preparedPlan: {pristine: {meta: {type: 'query', version: '0.2'}}}}},
    {data: {simplifiedPlan: {plan: [{name: 'Scan', operationParams: {}}]}}},
] as Partial<QueryResult>[])('does not claim that the plan is disabled for %j', (patch) => {
    expect(isQueryPlanNotEnabled({...result, ...patch})).toBe(false);
});
