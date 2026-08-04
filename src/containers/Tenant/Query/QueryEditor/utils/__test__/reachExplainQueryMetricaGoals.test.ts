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
        const params = {queryMode: 'query'};

        reachExplainQueryMetricaGoals(QUERY_ACTIONS.explain, params);

        expect(reachMetricaGoalMock).toHaveBeenCalledTimes(1);
        expect(reachMetricaGoalMock).toHaveBeenCalledWith('runQuery', {
            ...params,
            actionType: 'explain',
        });
    });

    test('uses the documented metric action for both Explain Analyze goals', () => {
        const params = {queryMode: 'query'};

        reachExplainQueryMetricaGoals(QUERY_ACTIONS.explainAnalyze, params);

        const expectedParams = {...params, actionType: 'explainAnalyze'};
        expect(reachMetricaGoalMock).toHaveBeenCalledTimes(2);
        expect(reachMetricaGoalMock).toHaveBeenNthCalledWith(1, 'runQuery', expectedParams);
        expect(reachMetricaGoalMock).toHaveBeenNthCalledWith(
            2,
            'explainAnalyzeQuery',
            expectedParams,
        );
        expect(reachMetricaGoalMock.mock.calls[0]?.[1]).toBe(
            reachMetricaGoalMock.mock.calls[1]?.[1],
        );
    });
});
