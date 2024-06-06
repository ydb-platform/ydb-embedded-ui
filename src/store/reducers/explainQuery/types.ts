import type {ExplainPlanNodeData, GraphNode, Link} from '@gravity-ui/paranoid';

import type {PlanTable, QueryPlan, ScriptPlan} from '../../../types/api/query';

export interface PreparedExplainResponse {
    plan?: {
        links?: Link[];
        nodes?: GraphNode<ExplainPlanNodeData>[];
        tables?: PlanTable[];
        version?: string;
        pristine?: QueryPlan | ScriptPlan;
    };
    ast?: string;
}
