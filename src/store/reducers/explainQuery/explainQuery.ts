import {TracingLevelNumber} from '../../../types/api/query';
import type {ExplainActions} from '../../../types/api/query';
import type {QueryRequestParams, QuerySettings, QuerySyntax} from '../../../types/store/query';
import {QUERY_SYNTAX, isQueryErrorResponse} from '../../../utils/query';
import {isNumeric} from '../../../utils/utils';
import {api} from '../api';

import type {PreparedExplainResponse} from './types';
import {prepareExplainResponse} from './utils';

interface ExplainQueryParams extends QueryRequestParams {
    querySettings?: Partial<QuerySettings>;
}

export const explainQueryApi = api.injectEndpoints({
    endpoints: (build) => ({
        explainQuery: build.mutation<PreparedExplainResponse, ExplainQueryParams>({
            queryFn: async ({query, database, querySettings}) => {
                let action: ExplainActions = 'explain';
                let syntax: QuerySyntax = QUERY_SYNTAX.yql;

                if (querySettings?.queryMode === 'pg') {
                    action = 'explain-query';
                    syntax = QUERY_SYNTAX.pg;
                } else if (querySettings?.queryMode) {
                    action = `explain-${querySettings?.queryMode}`;
                }

                try {
                    const response = await window.api.sendQuery({
                        query,
                        database,
                        action,
                        syntax,
                        stats: querySettings?.statisticsMode,
                        tracingLevel: querySettings?.tracingLevel
                            ? TracingLevelNumber[querySettings?.tracingLevel]
                            : undefined,
                        transaction_mode: querySettings?.isolationLevel,
                        timeout: isNumeric(querySettings?.timeout)
                            ? Number(querySettings?.timeout) * 1000
                            : undefined,
                    });

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
