import {explainVersions} from '../../../../store/reducers/explainQuery/utils';
import type {IQueryResult} from '../../../../types/store/query';
import {preparePlan, prepareSimplifiedPlan} from '../../../../utils/prepareQueryExplain';
import {parseQueryExplainPlan} from '../../../../utils/query';

export function getPlan(data: IQueryResult | undefined) {
    if (!data) {
        return {};
    }

    const {plan} = data;

    if (plan) {
        const queryPlan = parseQueryExplainPlan(plan);
        const isSupportedVersion = queryPlan.meta.version === explainVersions.v2;
        if (!isSupportedVersion) {
            return {};
        }

        const {Plan: planWithStats, SimplifiedPlan: simplifiedPlan} = queryPlan;

        return {
            plan: planWithStats
                ? {...preparePlan(planWithStats), tables: queryPlan.tables}
                : undefined,
            simplifiedPlan: {
                plan: simplifiedPlan ? prepareSimplifiedPlan([simplifiedPlan]) : undefined,
                pristine: simplifiedPlan,
            },
        };
    }

    const {stats} = data;
    const planFromStats = stats?.Executions?.[0]?.TxPlansWithStats?.[0];
    if (!planFromStats) {
        return {};
    }
    try {
        const planWithStats = JSON.parse(planFromStats);
        return {plan: preparePlan(planWithStats)};
    } catch (e) {
        return {};
    }
}
