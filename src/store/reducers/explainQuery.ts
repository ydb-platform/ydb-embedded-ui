import type {Reducer} from '@reduxjs/toolkit';
import type {ExplainPlanNodeData, GraphNode, Link} from '@gravity-ui/paranoid';

import type {ExplainActions} from '../../types/api/query';
import type {
    ExplainQueryAction,
    ExplainQueryState,
    PreparedExplainResponse,
} from '../../types/store/explainQuery';
import type {QueryRequestParams, QueryMode, QuerySyntax} from '../../types/store/query';

import {preparePlan} from '../../utils/prepareQueryExplain';
import {QUERY_SYNTAX, parseQueryAPIExplainResponse, parseQueryExplainPlan} from '../../utils/query';
import {parseQueryError} from '../../utils/error';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const GET_EXPLAIN_QUERY = createRequestActionTypes('query', 'GET_EXPLAIN_QUERY');
export const GET_EXPLAIN_QUERY_AST = createRequestActionTypes('query', 'GET_EXPLAIN_QUERY_AST');

const initialState = {
    loading: false,
};

const explainQuery: Reducer<ExplainQueryState, ExplainQueryAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case GET_EXPLAIN_QUERY.REQUEST: {
            return {
                ...state,
                loading: true,
                data: undefined,
                error: undefined,
                dataAst: undefined,
                errorAst: undefined,
            };
        }
        case GET_EXPLAIN_QUERY.SUCCESS: {
            return {
                ...state,
                data: action.data.plan,
                dataAst: action.data.ast,
                loading: false,
                error: undefined,
            };
        }
        case GET_EXPLAIN_QUERY.FAILURE: {
            return {
                ...state,
                error: parseQueryError(action.error),
                loading: false,
            };
        }
        case GET_EXPLAIN_QUERY_AST.REQUEST: {
            return {
                ...state,
                loadingAst: true,
                dataAst: undefined,
                errorAst: undefined,
            };
        }
        case GET_EXPLAIN_QUERY_AST.SUCCESS: {
            return {
                ...state,
                dataAst: action.data.ast,
                loadingAst: false,
                error: undefined,
            };
        }
        case GET_EXPLAIN_QUERY_AST.FAILURE: {
            return {
                ...state,
                errorAst: parseQueryError(action.error),
                loadingAst: false,
            };
        }

        default:
            return state;
    }
};

export const getExplainQueryAst = ({query, database}: QueryRequestParams) => {
    return createApiRequest({
        request: window.api.getExplainQueryAst(query, database),
        actions: GET_EXPLAIN_QUERY_AST,
        dataHandler: parseQueryAPIExplainResponse,
    });
};

export const explainVersions = {
    v2: '0.2',
};

const supportedExplainQueryVersions = Object.values(explainVersions);

interface ExplainQueryParams extends QueryRequestParams {
    mode?: QueryMode;
}

export const getExplainQuery = ({query, database, mode}: ExplainQueryParams) => {
    let action: ExplainActions = 'explain';
    let syntax: QuerySyntax = QUERY_SYNTAX.yql;

    if (mode === 'pg') {
        action = 'explain-query';
        syntax = QUERY_SYNTAX.pg;
    } else if (mode) {
        action = `explain-${mode}`;
    }

    return createApiRequest({
        request: window.api.getExplainQuery(query, database, action, syntax),
        actions: GET_EXPLAIN_QUERY,
        dataHandler: (response): PreparedExplainResponse => {
            const {plan: rawPlan, ast} = parseQueryAPIExplainResponse(response);

            if (!rawPlan) {
                return {ast};
            }

            const {tables, meta, Plan} = parseQueryExplainPlan(rawPlan);

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

            return {
                plan: {
                    links,
                    nodes,
                    tables,
                    version: meta.version,
                    pristine: rawPlan,
                },
                ast,
            };
        },
    });
};

export default explainQuery;
