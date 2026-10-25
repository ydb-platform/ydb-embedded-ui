import {createSelector} from '@reduxjs/toolkit';

import {prepareNodesMap} from '../../utils/nodes';
import type {RootState} from '../defaultStore';
import type {QueryScope} from '../queryScope';
import {getQueryScope} from '../queryScope';

import {api} from './api';

export const nodesListApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNodesList: build.query({
            queryFn: async ({database}: {database?: string; scope?: QueryScope}, {signal}) => {
                try {
                    const data = await window.api.viewer.getNodesList({database}, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            serializeQueryArgs: ({queryArgs}) => ({
                ...getQueryScope(queryArgs.scope),
                database: queryArgs.database,
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
    (database, backend, environment, clusterName) =>
        nodesListApi.endpoints.getNodesList.select({
            database,
            scope: {backend, environment, clusterName},
        }),
);

const selectScopedNodesMap = createSelector(
    (state: RootState, database: string | undefined, scope: QueryScope) =>
        createGetNodesListSelector(database, scope)(state).data,
    prepareNodesMap,
);

export function selectNodesMap(state: RootState, database?: string) {
    return selectScopedNodesMap(state, database, getQueryScope());
}
