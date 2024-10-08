import type {ExplainPlanNodeData, GraphNode, Link} from '@gravity-ui/paranoid';

import type {ExplainQueryResponse, ExplainScriptResponse} from '../../../types/api/query';
import {preparePlan, prepareSimplifiedPlan} from '../../../utils/prepareQueryExplain';
import {parseQueryAPIExplainResponse, parseQueryExplainPlan} from '../../../utils/query';

import type {PreparedExplainResponse} from './types';

export const explainVersions = {
    v2: '0.2',
};

const supportedExplainQueryVersions = Object.values(explainVersions);

export const prepareExplainResponse = (
    response: ExplainScriptResponse | ExplainQueryResponse | null,
): PreparedExplainResponse => {
    const {plan: rawPlan, ast} = parseQueryAPIExplainResponse(response);

    if (!rawPlan) {
        return {ast};
    }

    const {tables, meta, Plan, SimplifiedPlan} = parseQueryExplainPlan(rawPlan);

    if (supportedExplainQueryVersions.indexOf(meta.version) === -1) {
        // Do not prepare plan for not supported versions
        return {
            plan: {
                pristine: rawPlan,
                version: meta.version,
            },
            ast,
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
        plan: {
            links,
            nodes,
            tables,
            version: meta.version,
            pristine: rawPlan,
        },
        simplifiedPlan: {plan: preparedSimplifiedPlan, pristine: SimplifiedPlan},
        ast,
    };
};
