import type {QueryPlan, ScriptPlan, TKqpStatsQuery} from '../../../types/api/query';
import {preparePlan, prepareSimplifiedPlan} from '../../../utils/prepareQueryExplain';
import {parseQueryExplainPlan} from '../../../utils/query';

import type {ExplainPlanNodeData, GraphNode, Link, PreparedQueryData} from './types';

const explainVersions = {
    v2: '0.2',
};

const supportedExplainQueryVersions = Object.values(explainVersions);

export function preparePlanData(
    rawPlan?: QueryPlan | ScriptPlan,
    stats?: TKqpStatsQuery,
): PreparedQueryData['preparedPlan'] & {
    simplifiedPlan?: PreparedQueryData['simplifiedPlan'];
} {
    // Handle plan from explain
    if (rawPlan) {
        const {tables, meta, Plan, SimplifiedPlan} = parseQueryExplainPlan(rawPlan);

        if (supportedExplainQueryVersions.indexOf(meta.version) === -1) {
            // Do not prepare plan for not supported versions
            return {
                pristine: rawPlan,
                version: meta.version,
            };
        }

        let links: Link[] = [];
        let nodes: GraphNode<ExplainPlanNodeData>[] = [];

        if (Plan) {
            const preparedPlan = preparePlan(Plan);
            links = preparedPlan.links;
            nodes = preparedPlan.nodes;
        }

        let preparedSimplifiedPlan;
        if (SimplifiedPlan) {
            preparedSimplifiedPlan = prepareSimplifiedPlan([SimplifiedPlan]);
        }

        return {
            links,
            nodes,
            tables,
            version: meta.version,
            pristine: rawPlan,
            simplifiedPlan: SimplifiedPlan
                ? {
                      plan: preparedSimplifiedPlan,
                      pristine: SimplifiedPlan,
                  }
                : undefined,
        };
    }

    // Handle plan from stats
    const planFromStats = stats?.Executions?.[0]?.TxPlansWithStats?.[0];
    if (planFromStats) {
        try {
            const planWithStats = JSON.parse(planFromStats);
            return {...preparePlan(planWithStats), pristine: planWithStats};
        } catch {
            return {};
        }
    }

    return {};
}
