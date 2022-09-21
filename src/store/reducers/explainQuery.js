import _ from 'lodash';

import '../../services/api';

import {getExplainNodeId, getMetaForExplainNode} from '../../utils';
import {preparePlan} from '../../utils/prepareQueryExplain';
import {parseQueryAPIExplainResponse} from '../../utils/query';

import {createRequestActionTypes, createApiRequest} from '../utils';

const GET_EXPLAIN_QUERY = createRequestActionTypes('query', 'GET_EXPLAIN_QUERY');
const GET_EXPLAIN_QUERY_AST = createRequestActionTypes('query', 'GET_EXPLAIN_QUERY_AST');

const initialState = {
    loading: false,
};

const explainQuery = (state = initialState, action) => {
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
        // 401 Unauthorized error is handled by GenericAPI
        case GET_EXPLAIN_QUERY.FAILURE: {
            return {
                ...state,
                error: action.error || 'Unauthorized',
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
                errorAst: action.error || 'Unauthorized',
                loadingAst: false,
            };
        }

        default:
            return state;
    }
};

export const getExplainQueryAst = ({query, database}) => {
    return createApiRequest({
        request: window.api.getExplainQueryAst(query, database),
        actions: GET_EXPLAIN_QUERY_AST,
        dataHandler: parseQueryAPIExplainResponse,
    });
};

export const explainVersions = {
    v1: '0.1',
    v2: '0.2',
};

const supportedExplainQueryVersions = Object.values(explainVersions);

export const getExplainQuery = ({query, database}) => {
    return createApiRequest({
        request: window.api.getExplainQuery(query, database),
        actions: GET_EXPLAIN_QUERY,
        dataHandler: (response) => {
            const {plan: result, ast} = parseQueryAPIExplainResponse(response);

            if (!result) {
                return {ast};
            }

            let links = [];
            let nodes = [];
            let graphDepth;
            const {tables, meta, Plan} = result;

            if (supportedExplainQueryVersions.indexOf(meta.version) === -1) {
                return {
                    pristine: result,
                    version: meta.version,
                };
            }
            if (meta.version === explainVersions.v2) {
                const preparedPlan = preparePlan(Plan);
                links = preparedPlan.links;
                nodes = preparedPlan.nodes;
                graphDepth = preparedPlan.graphDepth;
            } else {
                graphDepth = tables.length;
                _.forEach(tables, (table) => {
                    nodes.push({
                        name: table.name,
                    });

                    const tableTypes = {};

                    const {reads = [], writes = []} = table;
                    let prevEl = null;

                    _.forEach([...reads, ...writes], (node) => {
                        if (tableTypes[node.type]) {
                            tableTypes[node.type] = tableTypes[node.type] + 1;
                        } else {
                            tableTypes[node.type] = 1;
                        }

                        const nodeId = getExplainNodeId(
                            table.name,
                            node.type,
                            tableTypes[node.type],
                        );

                        let prevNodeId = table.name;
                        if (prevEl) {
                            prevNodeId =
                                node.type === prevEl.type
                                    ? getExplainNodeId(
                                          table.name,
                                          prevEl.type,
                                          tableTypes[prevEl.type] - 1,
                                      )
                                    : getExplainNodeId(
                                          table.name,
                                          prevEl.type,
                                          tableTypes[prevEl.type],
                                      );
                        }

                        links.push({
                            from: prevNodeId,
                            to: nodeId,
                        });
                        nodes.push({
                            name: nodeId,
                            meta: getMetaForExplainNode(node),
                            id: nodeId,
                        });

                        prevEl = node;
                    });
                });
            }

            return {
                plan: {
                    links,
                    nodes,
                    tables,
                    version: meta.version,
                    pristine: result,
                    graphDepth,
                },
                ast,
            };
        },
    });
};

export default explainQuery;
