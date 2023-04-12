import type {ExplainPlanNodeData, GraphNode, Link} from '@gravity-ui/paranoid';

import {GET_EXPLAIN_QUERY, GET_EXPLAIN_QUERY_AST} from '../../store/reducers/explainQuery';
import type {ApiRequestAction} from '../../store/utils';
import type {IQueryResult} from './query';

export interface PreparedExplainResponse {
    plan?: {
        links?: Link[];
        nodes?: GraphNode<ExplainPlanNodeData>[];
        tables?: unknown;
        version?: string;
        pristine?: unknown;
    };
    ast?: IQueryResult['ast'];
}

export interface ExplainQueryState {
    loading: boolean;
    data?: PreparedExplainResponse['plan'];
    dataAst?: IQueryResult['ast'];
    error?: unknown;
    errorAst?: unknown;
}

type GetExplainQueryAstAction = ApiRequestAction<
    typeof GET_EXPLAIN_QUERY_AST,
    IQueryResult,
    unknown
>;
type GetExplainQueryAction = ApiRequestAction<
    typeof GET_EXPLAIN_QUERY,
    PreparedExplainResponse,
    unknown
>;

export type ExplainQueryAction = GetExplainQueryAstAction | GetExplainQueryAction;
