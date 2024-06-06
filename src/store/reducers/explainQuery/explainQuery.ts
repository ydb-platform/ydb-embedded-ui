import type {ExplainActions} from '../../../types/api/query';
import type {QueryMode, QueryRequestParams, QuerySyntax} from '../../../types/store/query';
import {QUERY_SYNTAX, isQueryErrorResponse} from '../../../utils/query';
import {api} from '../api';

import type {PreparedExplainResponse} from './types';
import {prepareExplainResponse} from './utils';

interface ExplainQueryParams extends QueryRequestParams {
    mode?: QueryMode;
}

export const explainQueryApi = api.injectEndpoints({
    endpoints: (build) => ({
        explainQuery: build.mutation<PreparedExplainResponse, ExplainQueryParams>({
            queryFn: async ({query, database, mode}) => {
                let action: ExplainActions = 'explain';
                let syntax: QuerySyntax = QUERY_SYNTAX.yql;

                if (mode === 'pg') {
                    action = 'explain-query';
                    syntax = QUERY_SYNTAX.pg;
                } else if (mode) {
                    action = `explain-${mode}`;
                }

                try {
                    const response = await window.api.getExplainQuery(
                        query,
                        database,
                        action,
                        syntax,
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
