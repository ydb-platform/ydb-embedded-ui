import tableFormI18n from '../../containers/Tenant/TableFormDialog/i18n';
import type {
    DocumentTableContext,
    DocumentTableDefinition,
    DocumentTableSchema,
} from '../../uiFactory/types';
import {uiFactory} from '../../uiFactory/uiFactory';

import {api} from './api';

export const documentTablesApi = api.injectEndpoints({
    endpoints: (build) => ({
        createDocumentTable: build.mutation<
            void,
            {context: DocumentTableContext; definition: DocumentTableDefinition}
        >({
            queryFn: async ({context, definition}, {signal}) => {
                try {
                    const create = uiFactory.documentTables?.create;
                    if (!create) {
                        throw new Error(tableFormI18n('alert_table-type-unavailable'));
                    }
                    await create(context, definition, {signal});
                    return {data: undefined};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, error) => (error ? [] : ['SchemaTree']),
        }),
        getDocumentTableSchema: build.query<DocumentTableSchema | null, DocumentTableContext>({
            queryFn: async (context, {signal}) => {
                try {
                    const data = await uiFactory.documentTables?.getSchema?.(context, {signal});
                    return {data: data ?? null};
                } catch (error) {
                    return {error};
                }
            },
            keepUnusedDataFor: 0,
            providesTags: ['All', 'SchemaTree'],
        }),
    }),
    overrideExisting: 'throw',
});
