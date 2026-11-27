import type {ExecuteActions} from '../../types/api/query';
import type {DocumentTableContext, DocumentTablePreviewData} from '../../uiFactory/types';
import {uiFactory} from '../../uiFactory/uiFactory';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../utils/query';

import {api} from './api';

type PreviewQueryAction = Exclude<ExecuteActions, 'execute-query-and-forget'>;

const DOCUMENT_PREVIEW_LIMIT = 100;

interface SendQueryParams {
    query?: string;
    database?: string;
    databaseFullPath?: string;
    path?: string;
    environment?: string;
    clusterName?: string;
    backend?: string;
    action?: PreviewQueryAction;
    limitRows?: number;
    base64?: boolean;
}

export const previewApi = api.injectEndpoints({
    endpoints: (build) => ({
        sendQuery: build.query({
            queryFn: async (
                {query, database, action, limitRows, base64}: SendQueryParams,
                {signal},
            ) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {query, database, action, limit_rows: limitRows, base64},
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: parseQueryAPIResponse(response)};
                } catch (error) {
                    return {error: error || new Error('Unauthorized')};
                }
            },
            providesTags: ['PreviewData'],
        }),
        getDocumentTablePreview: build.query<DocumentTablePreviewData | null, DocumentTableContext>(
            {
                queryFn: async (context, {signal}) => {
                    try {
                        const data = await uiFactory.documentTables?.getPreview?.(context, {
                            signal,
                            limit: DOCUMENT_PREVIEW_LIMIT,
                        });
                        return {data: data ?? null};
                    } catch (error) {
                        return {error};
                    }
                },
                keepUnusedDataFor: 0,
                providesTags: ['PreviewData'],
            },
        ),
    }),
    overrideExisting: 'throw',
});
