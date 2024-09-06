import type {CancelActions} from '../../types/api/query';
import type {IQueryResult, QueryRequestParams} from '../../types/store/query';
import {isQueryErrorResponse, parseQueryAPIExecuteResponse} from '../../utils/query';

import {api} from './api';
import {updateQueryResult} from './executeQuery';

interface SendQueryParams extends Omit<QueryRequestParams, 'query'> {
    queryId: string;
}

export const cancelQueryApi = api.injectEndpoints({
    endpoints: (build) => ({
        cancelQuery: build.mutation<IQueryResult, SendQueryParams>({
            queryFn: async ({queryId, database}, {signal, dispatch}) => {
                const action: CancelActions = 'cancel-query';
                dispatch(
                    updateQueryResult({
                        cancelledStatus: 'loading',
                    }),
                );

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
                        dispatch(
                            updateQueryResult({
                                cancelledStatus: 'error',
                            }),
                        );
                        return {error: response};
                    }

                    const data = parseQueryAPIExecuteResponse(response);
                    dispatch(
                        updateQueryResult({
                            cancelledStatus: 'success',
                        }),
                    );
                    return {data};
                } catch (error) {
                    dispatch(
                        updateQueryResult({
                            cancelledStatus: 'error',
                        }),
                    );
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
