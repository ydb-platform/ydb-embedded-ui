import type {ExplainPlanNodeData, GraphNode, Link} from '@gravity-ui/paranoid';

import type {ExecuteResponse, ExplainResponse} from '../../../types/api/query';
import {preparePlan, prepareSimplifiedPlan} from '../../../utils/prepareQueryExplain';
import {parseQueryAPIResponse, parseQueryExplainPlan} from '../../../utils/query';

import type {PreparedQueryData} from './types';

const explainVersions = {
    v2: '0.2',
};

const supportedExplainQueryVersions = Object.values(explainVersions);

export function prepareQueryData(
    response: ExplainResponse | ExecuteResponse | null,
): PreparedQueryData {
    const result = parseQueryAPIResponse(response);
    const {plan: rawPlan, stats} = result;

    if (rawPlan) {
        const {tables, meta, Plan, SimplifiedPlan} = parseQueryExplainPlan(rawPlan);

        if (supportedExplainQueryVersions.indexOf(meta.version) === -1) {
            // Do not prepare plan for not supported versions
            return {
                ...result,
                preparedPlan: {
                    pristine: rawPlan,
                    version: meta.version,
                },
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
            ...result,
            preparedPlan: {
                links,
                nodes,
                tables,
                version: meta.version,
                pristine: rawPlan,
            },
            simplifiedPlan: {plan: preparedSimplifiedPlan, pristine: SimplifiedPlan},
        };
    }

    const planFromStats = stats?.Executions?.[0]?.TxPlansWithStats?.[0];
    if (planFromStats) {
        try {
            const planWithStats = JSON.parse(planFromStats);
            return {
                ...result,
                preparedPlan: {...preparePlan(planWithStats), pristine: planWithStats},
            };
        } catch (e) {}
    }

    return result;
}
