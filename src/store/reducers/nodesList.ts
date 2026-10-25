import {createSelector} from '@reduxjs/toolkit';

import {prepareNodesMap} from '../../utils/nodes';
import type {RootState} from '../defaultStore';
import type {QueryScope} from '../queryScope';
import {getQueryScope} from '../queryScope';

import {api} from './api';

export interface NodesListQueryArgs {
    database?: string;
    scope?: QueryScope;
    include_storage?: boolean;
}

export const nodesListApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodesList: build.query({
            queryFn: async (
                {database, include_storage: includeStorage}: NodesListQueryArgs,
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getNodesList(
                        {database, include_storage: includeStorage},
                        {signal},
                    );
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            serializeQueryArgs: ({queryArgs}) => ({
                ...getQueryScope(queryArgs.scope),
                database: queryArgs.database,
                include_storage: queryArgs.include_storage,
            }),
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});

const createGetNodesListSelector = createSelector(
    (database: string | undefined) => database,
    (_database: string | undefined, scope: QueryScope) => scope.backend,
    (_database: string | undefined, scope: QueryScope) => scope.environment,
    (_database: string | undefined, scope: QueryScope) => scope.clusterName,
    (_database: string | undefined, _scope: QueryScope, includeStorage?: boolean) => includeStorage,
    (database, backend, environment, clusterName, includeStorage) =>
        nodesListApi.endpoints.getNodesList.select({
            database,
            scope: {backend, environment, clusterName},
            include_storage: includeStorage,
        }),
);

const selectScopedNodesMap = createSelector(
    (state: RootState, database: string | undefined, scope: QueryScope, includeStorage?: boolean) =>
        createGetNodesListSelector(database, scope, includeStorage)(state).data,
    prepareNodesMap,
);

export function selectNodesMap(state: RootState, database?: string, includeStorage?: boolean) {
    return selectScopedNodesMap(state, database, getQueryScope(), includeStorage);
}
