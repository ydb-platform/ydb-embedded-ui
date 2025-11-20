import type {ExplainPlanNodeData, GraphNode, Link} from '@gravity-ui/paranoid';

import type {
    PlanTable,
    QueryPlan,
    ScriptPlan,
    SimlifiedPlanOperatorOtherParams,
    SimplifiedNode,
} from '../../../types/api/query';
import type {IQueryResult, QueryAction} from '../../../types/store/query';

export interface QueryInHistory {
    queryId?: string;
    queryText: string;
    syntax?: string;
    endTime?: string | number;
    durationUs?: string | number;
}

export interface PreparedPlan {
    links?: Link[];
    nodes?: GraphNode<ExplainPlanNodeData>[];
    tables?: PlanTable[];
    version?: string;
    pristine?: QueryPlan | ScriptPlan;
    DurationUs?: string | number;
}

interface SimplifiedPlan {
    plan?: SimplifiedPlanItem[];
    pristine?: SimplifiedNode;
}

export interface SimplifiedPlanItem {
    parentId?: string;
    name: string;
    operationParams: SimlifiedPlanOperatorOtherParams;
    aCpu?: number;
    aRows?: number;
    eCost?: string;
    eRows?: string;
    eSize?: string;
    children?: SimplifiedPlanItem[];
}

export interface PreparedQueryData extends IQueryResult {
    preparedPlan?: PreparedPlan;
    simplifiedPlan?: SimplifiedPlan;
}

export interface QueryResult {
    type: QueryAction;
    data?: PreparedQueryData;
    error?: unknown;
    queryId: string;
    startTime?: number;
    endTime?: number;
    isLoading: boolean;
}

export interface QueryState {
    input: string;
    result?: QueryResult;
    isDirty?: boolean;
    historyFilter?: string;
    tenantPath?: string;
    selectedResultTab?: {
        execute?: string;
        explain?: string;
    };
}

export interface QueryStats {
    durationUs?: string | number;
    endTime?: string | number;
}
