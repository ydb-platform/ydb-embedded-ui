import type {CancelActions} from '../../types/api/query';
import type {IQueryResult, QueryRequestParams} from '../../types/store/query';
import {isQueryErrorResponse, parseQueryAPIExecuteResponse} from '../../utils/query';

import {api} from './api';

interface SendQueryParams extends Omit<QueryRequestParams, 'query'> {
    queryId: string;
}

export const cancelQueryApi = api.injectEndpoints({
    endpoints: (build) => ({
        cancelQuery: build.mutation<IQueryResult, SendQueryParams>({
            queryFn: async ({queryId, database}, {signal}) => {
                const action: CancelActions = 'cancel-query';

                try {
                    const response = await window.api.sendQuery(
                        {
                            database,
                            action,
                            query_id: queryId,
                        },
                        {signal},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIExecuteResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
