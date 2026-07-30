import {QUERY_ACTIONS} from '../../../../../../utils/query';
import {reachMetricaGoal} from '../../../../../../utils/yaMetrica';
import {reachExplainQueryMetricaGoals} from '../reachExplainQueryMetricaGoals';

jest.mock('../../../../../../utils/yaMetrica', () => ({
    reachMetricaGoal: jest.fn(),
}));

const reachMetricaGoalMock = jest.mocked(reachMetricaGoal);

describe('reachExplainQueryMetricaGoals', () => {
    beforeEach(() => {
        reachMetricaGoalMock.mockClear();
    });

    test('keeps regular Explain in the aggregate runQuery goal', () => {
        const params = {actionType: QUERY_ACTIONS.explain, queryMode: 'query'};

        reachExplainQueryMetricaGoals(QUERY_ACTIONS.explain, params);

        expect(reachMetricaGoalMock).toHaveBeenCalledTimes(1);
        expect(reachMetricaGoalMock).toHaveBeenCalledWith('runQuery', params);
    });

    test('sends aggregate and dedicated Explain Analyze goals with the same params', () => {
        const params = {actionType: QUERY_ACTIONS.explainAnalyze, queryMode: 'query'};

        reachExplainQueryMetricaGoals(QUERY_ACTIONS.explainAnalyze, params);

        expect(reachMetricaGoalMock).toHaveBeenCalledTimes(2);
        expect(reachMetricaGoalMock).toHaveBeenNthCalledWith(1, 'runQuery', params);
        expect(reachMetricaGoalMock).toHaveBeenNthCalledWith(2, 'explainAnalyzeQuery', params);
        expect(reachMetricaGoalMock.mock.calls[0]?.[1]).toBe(params);
        expect(reachMetricaGoalMock.mock.calls[1]?.[1]).toBe(params);
    });
});
