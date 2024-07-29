import {explainVersions} from '../../../../store/reducers/explainQuery/utils';
import type {IQueryResult} from '../../../../types/store/query';
import {preparePlan} from '../../../../utils/prepareQueryExplain';
import {parseQueryExplainPlan} from '../../../../utils/query';

export function getPlan(data: IQueryResult | undefined) {
    if (!data) {
        return undefined;
    }

    const {plan} = data;

    if (plan) {
        const queryPlan = parseQueryExplainPlan(plan);
        const isSupportedVersion = queryPlan.meta.version === explainVersions.v2;
        if (!isSupportedVersion) {
            return undefined;
        }

        const planWithStats = queryPlan.Plan;
        if (!planWithStats) {
            return undefined;
        }
        return {
            ...preparePlan(planWithStats),
            tables: queryPlan.tables,
        };
    }

    const {stats} = data;
    const planFromStats = stats?.Executions?.[0]?.TxPlansWithStats?.[0];
    if (!planFromStats) {
        return undefined;
    }
    try {
        const planWithStats = JSON.parse(planFromStats);
        return preparePlan(planWithStats);
    } catch (e) {
        return undefined;
    }
}
