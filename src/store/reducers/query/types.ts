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

export interface Link {
    from: string;
    to: string;
}

export interface Metric {
    name: string;
    value: string;
    theme?: 'warning' | 'danger';
}

export interface GraphNode<TData = any> {
    name: string;
    status?: string;
    meta?: string;
    group?: string;
    data?: TData;
    metrics?: Metric[];
}

export interface ExplainPlanNodeData {
    id?: number;
    type: 'query' | 'result' | 'stage' | 'connection' | 'materialize';
    name?: string;
    operators?: string[];
    tables?: string[];
    cte?: string;
    stats?: TopologyNodeDataStats[];
}
export interface TopologyNodeDataStatsItem {
    name: string;
    value: string | number;
}
export interface TopologyNodeDataStatsSection {
    name: string;
    items: TopologyNodeDataStatsItem[];
}
export interface TopologyNodeDataStats {
    group: string;
    stats: TopologyNodeDataStatsSection[] | TopologyNodeDataStatsItem[];
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
    history: {
        queries: QueryInHistory[];
        currentIndex: number;
        filter?: string;
    };
    tenantPath?: string;
    selectedResultTab?: {
        execute?: string;
        explain?: string;
    };
}
