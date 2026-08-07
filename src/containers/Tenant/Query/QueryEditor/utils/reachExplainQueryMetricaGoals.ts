import type {QueryAction} from '../../../../../types/store/query';
import {QUERY_ACTIONS} from '../../../../../utils/query';
import {reachMetricaGoal} from '../../../../../utils/yaMetrica';

type MetricaParams = NonNullable<Parameters<typeof reachMetricaGoal>[1]>;

export function reachExplainQueryMetricaGoals(actionType: QueryAction, params: MetricaParams) {
    const metricaParams = {
        ...params,
        actionType: actionType === QUERY_ACTIONS.explainAnalyze ? 'explainAnalyze' : actionType,
    };

    reachMetricaGoal('runQuery', metricaParams);

    if (actionType === QUERY_ACTIONS.explainAnalyze) {
        reachMetricaGoal('explainAnalyzeQuery', metricaParams);
    }
}
