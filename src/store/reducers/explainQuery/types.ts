import type {ExplainPlanNodeData, GraphNode, Link} from '@gravity-ui/paranoid';

import type {
    PlanTable,
    QueryPlan,
    ScriptPlan,
    SimlifiedPlanOperatorOtherParams,
} from '../../../types/api/query';

export interface PreparedExplainResponse {
    plan?: {
        links?: Link[];
        nodes?: GraphNode<ExplainPlanNodeData>[];
        tables?: PlanTable[];
        version?: string;
        pristine?: QueryPlan | ScriptPlan;
    };
    simplifiedPlan?: SimplifiedPlanItem[];
    ast?: string;
}

export interface SimplifiedPlanItem {
    parentId?: string | undefined;
    name: string;
    operationParams: SimlifiedPlanOperatorOtherParams;
    aCpu?: number;
    aRows?: number;
    eCost?: string;
    eRows?: string;
    eSize?: string;
    children?: SimplifiedPlanItem[];
}
