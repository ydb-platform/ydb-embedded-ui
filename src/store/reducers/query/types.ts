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
    queryId: string;
    operationId?: string;
    realQueryId?: string;
    queryText: string;
    syntax?: string;
    endTime?: string | number;
    durationUs?: string | number;
}

export interface EnhancedQueryInHistory extends QueryInHistory {
    startTime?: number;
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

export type StreamingStatus = 'preparing' | 'running' | 'fetching';

export interface QueryResult {
    type: QueryAction;
    data?: PreparedQueryData;
    error?: unknown;
    queryId: string;
    operationId?: string;
    startTime?: number;
    endTime?: number;
    isLoading: boolean;
    streamingStatus?: StreamingStatus;
}

export interface QueryTabState {
    id: string;
    title: string;
    /**
     * True only when the user explicitly renamed the tab via UI.
     * Used for UX decisions (e.g. prefilling "Save as" name).
     */
    isTitleUserDefined?: boolean;
    input: string;
    isDirty: boolean;
    createdAt: number;
    updatedAt: number;
    lastExecutedQueryText?: string;
    result?: QueryResult;
}

export interface QueryState {
    activeTabId: string;
    tabsOrder: string[];
    tabsById: Record<string, QueryTabState>;

    historyFilter?: string;
    historyCurrentQueryId?: string;

    tenantPath?: string;
    selectedResultTab?: {
        execute?: string;
        explain?: string;
    };
}

export interface QueryStats {
    durationUs?: string | number;
    endTime?: string | number;
    status?: 'COMPLETED' | 'FAILED' | 'STOPPED';
    operationId?: string;
}
