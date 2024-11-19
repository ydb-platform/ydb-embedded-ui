import {TracingLevelNumber} from '../../../types/api/query';
import type {ExplainActions} from '../../../types/api/query';
import type {QueryRequestParams, QuerySettings, QuerySyntax} from '../../../types/store/query';
import {QUERY_SYNTAX, isQueryErrorResponse} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import {api} from '../api';

import {setQueryResult} from './executeQuery';
import {ResultType} from './executeQueryTypes';
import {prepareExplainResponse} from './expainUtils';

interface ExplainQueryParams extends QueryRequestParams {
    queryId: string;
    querySettings?: Partial<QuerySettings>;
    // flag whether to send new tracing header or not
    // default: not send
    enableTracingLevel?: boolean;
}

export const explainQueryApi = api.injectEndpoints({
    endpoints: (build) => ({
        explainQuery: build.mutation<null, ExplainQueryParams>({
            queryFn: async (
                {query, database, querySettings, enableTracingLevel, queryId},
                {signal, dispatch},
            ) => {
                let action: ExplainActions = 'explain';
                let syntax: QuerySyntax = QUERY_SYNTAX.yql;

                dispatch(setQueryResult({type: ResultType.EXPLAIN, queryId, isLoading: true}));

                if (querySettings?.queryMode === 'pg') {
                    action = 'explain-query';
                    syntax = QUERY_SYNTAX.pg;
                } else if (querySettings?.queryMode) {
                    action = `explain-${querySettings?.queryMode}`;
                }

                try {
                    const response = await window.api.sendQuery(
                        {
                            query,
                            database,
                            action,
                            syntax,
                            stats: querySettings?.statisticsMode,
                            tracingLevel:
                                querySettings?.tracingLevel && enableTracingLevel
                                    ? TracingLevelNumber[querySettings?.tracingLevel]
                                    : undefined,
                            transaction_mode:
                                querySettings?.transactionMode === 'implicit'
                                    ? undefined
                                    : querySettings?.transactionMode,
                            timeout: isNumeric(querySettings?.timeout)
                                ? Number(querySettings?.timeout) * 1000
                                : undefined,
                            query_id: queryId,
                        },
                        {signal},
                    );

                    if (isQueryErrorResponse(response)) {
                        dispatch(
                            setQueryResult({
                                type: ResultType.EXPLAIN,
                                error: response,
                                queryId,
                                isLoading: false,
                            }),
                        );
                        return {error: response};
                    }

                    const data = prepareExplainResponse(response);
                    dispatch(
                        setQueryResult({
                            type: ResultType.EXPLAIN,
                            data,
                            queryId,
                            isLoading: false,
                        }),
                    );
                    return {data: null};
                } catch (error) {
                    dispatch(
                        setQueryResult({
                            type: ResultType.EXPLAIN,
                            error,
                            queryId,
                            isLoading: false,
                        }),
                    );
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
