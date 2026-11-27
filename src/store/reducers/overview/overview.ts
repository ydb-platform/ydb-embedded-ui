import {backend, clusterName, environment} from '../../runtimeParams';
import {api} from '../api';

interface GetOverviewParams {
    path: string;
    database: string;
    databaseFullPath: string;
    timeout?: number;
    useMetaProxy?: boolean;
    environment?: string;
    clusterName?: string;
    backend?: string;
}

export function getOverviewQueryArgs(params: GetOverviewParams) {
    return {environment, clusterName, backend, ...params};
}

export const overviewApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOverview: build.query({
            queryFn: async (
                {path, database, timeout, databaseFullPath, useMetaProxy}: GetOverviewParams,
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getDescribe(
                        {
                            path: {path, databaseFullPath, useMetaProxy},
                            database,
                            timeout,
                        },
                        {signal},
                    );
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            serializeQueryArgs: ({queryArgs}) => {
                const {
                    database,
                    path,
                    databaseFullPath,
                    useMetaProxy = false,
                    ...scope
                } = getOverviewQueryArgs(queryArgs);
                return {
                    database,
                    path,
                    databaseFullPath,
                    useMetaProxy,
                    environment: scope.environment,
                    clusterName: scope.clusterName,
                    backend: scope.backend,
                };
            },
            keepUnusedDataFor: 0,
            providesTags: ['All', 'SchemaTree'],
        }),
    }),
});

export function useGetOverviewQuery(
    params: GetOverviewParams,
    options?: {skip?: boolean; pollingInterval?: number},
) {
    return overviewApi.useGetOverviewQuery(getOverviewQueryArgs(params), options);
}
