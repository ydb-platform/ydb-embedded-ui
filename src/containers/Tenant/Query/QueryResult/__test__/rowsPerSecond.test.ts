import type {QueryResult} from '../../../../../store/reducers/query/types';
import type {TKqpStatsQuery} from '../../../../../types/api/query';
import type {ParsedResultSet} from '../../../../../types/store/query';
import {getResultRowsPerSecond} from '../utils';

function completeResult() {
    const resultSet: ParsedResultSet = {
        result: [{value: 1}],
        truncated: false,
    };
    const execution: NonNullable<TKqpStatsQuery['Executions']>[number] = {
        ResultRows: '1',
        DurationUs: '500000',
        Extra: {},
    };
    const resultSets = [resultSet];
    const executions = [execution];
    const data: NonNullable<QueryResult['data']> = {resultSets, stats: {Executions: executions}};
    const result: QueryResult = {
        executionId: 'run',
        queryId: 'q',
        type: 'execute',
        isLoading: false,
        endTime: 1,
        data,
    };
    return {result, resultSet, execution, resultSets, executions, data};
}

test('uses matching execution statistics in microseconds, including a real zero', () => {
    expect(getResultRowsPerSecond(completeResult().result)).toBe(2);
    const {result, resultSet, execution} = completeResult();
    resultSet.result = [];
    execution.ResultRows = 0;
    expect(getResultRowsPerSecond(result)).toBe(0);
});

test.each([undefined, '', 'bad', 'Infinity', Infinity, NaN, 0, -1])(
    'omits invalid duration %s',
    (duration) => {
        const {result, execution} = completeResult();
        execution.DurationUs = duration;
        expect(getResultRowsPerSecond(result)).toBeUndefined();
    },
);
test.each([undefined, '', 'bad', Infinity, NaN, -1, 0.5, 2, Number.MAX_SAFE_INTEGER + 1])(
    'omits missing, invalid or mismatched count %s',
    (rows) => {
        const {result, execution} = completeResult();
        execution.ResultRows = rows;
        expect(getResultRowsPerSecond(result)).toBeUndefined();
    },
);
test.each([
    'loading',
    'error',
    'streaming',
    'unfinished',
    'truncated',
    'multiple-results',
    'multiple-executions',
    'missing-stats',
    'missing-rows',
    'overflow',
])('omits %s results', (condition) => {
    const {result, resultSet, execution, resultSets, executions, data} = completeResult();
    switch (condition) {
        case 'loading':
            result.isLoading = true;
            break;
        case 'error':
            result.error = 'failed';
            break;
        case 'streaming':
            result.streamingStatus = 'running';
            break;
        case 'unfinished':
            result.endTime = undefined;
            break;
        case 'truncated':
            resultSet.truncated = true;
            break;
        case 'multiple-results':
            resultSets.push({result: []});
            break;
        case 'multiple-executions':
            executions.push({Extra: {}});
            break;
        case 'missing-stats':
            data.stats = undefined;
            break;
        case 'missing-rows':
            resultSet.result = undefined;
            break;
        case 'overflow':
            execution.DurationUs = Number.MIN_VALUE;
            break;
    }
    expect(getResultRowsPerSecond(result)).toBeUndefined();
});
