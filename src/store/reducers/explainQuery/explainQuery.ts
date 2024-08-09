import {TracingLevelNumber} from '../../../types/api/query';
import type {ExplainActions} from '../../../types/api/query';
import type {QueryRequestParams, QuerySettings, QuerySyntax} from '../../../types/store/query';
import {QUERY_SYNTAX, isQueryErrorResponse} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import {api} from '../api';

import type {PreparedExplainResponse} from './types';
import {prepareExplainResponse} from './utils';

interface ExplainQueryParams extends QueryRequestParams {
    queryId: string;
    querySettings?: Partial<QuerySettings>;
    // flag whether to send new tracing header or not
    // default: not send
    enableTracingLevel?: boolean;
}

export const explainQueryApi = api.injectEndpoints({
    endpoints: (build) => ({
        explainQuery: build.mutation<PreparedExplainResponse, ExplainQueryParams>({
            queryFn: async (
                {query, database, querySettings, enableTracingLevel, queryId},
                {signal},
            ) => {
                let action: ExplainActions = 'explain';
                let syntax: QuerySyntax = QUERY_SYNTAX.yql;

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
                            transaction_mode: querySettings?.isolationLevel,
                            timeout: isNumeric(querySettings?.timeout)
                                ? Number(querySettings?.timeout) * 1000
                                : undefined,
                            query_id: queryId,
                        },
                        {signal},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = prepareExplainResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
