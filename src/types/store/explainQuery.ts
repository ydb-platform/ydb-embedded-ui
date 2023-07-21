import type {ExplainPlanNodeData, GraphNode, Link} from '@gravity-ui/paranoid';

import {GET_EXPLAIN_QUERY, GET_EXPLAIN_QUERY_AST} from '../../store/reducers/explainQuery';
import type {ApiRequestAction} from '../../store/utils';
import type {PlanTable, QueryPlan, ScriptPlan} from '../api/query';
import type {IQueryResult, QueryError, QueryErrorResponse} from './query';

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

export interface ExplainQueryState {
    loading: boolean;
    data?: PreparedExplainResponse['plan'];
    dataAst?: PreparedExplainResponse['ast'];
    error?: string | QueryErrorResponse;
    errorAst?: string | QueryErrorResponse;
}

type GetExplainQueryAstAction = ApiRequestAction<
    typeof GET_EXPLAIN_QUERY_AST,
    IQueryResult,
    QueryError
>;
type GetExplainQueryAction = ApiRequestAction<
    typeof GET_EXPLAIN_QUERY,
    PreparedExplainResponse,
    QueryError
>;

export type ExplainQueryAction = GetExplainQueryAstAction | GetExplainQueryAction;
