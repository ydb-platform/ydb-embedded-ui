import {createSelector} from '@reduxjs/toolkit';
import {skipToken} from '@reduxjs/toolkit/query';

import {isEntityWithMergedImplementation} from '../../../containers/Tenant/utils/schema';
import type {EPathType} from '../../../types/api/schema';
import type {IDescribeData} from '../../../types/store/describe';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

export const overviewApi = api.injectEndpoints({
    endpoints: (build) => ({
        getMultiOverview: build.query({
            queryFn: async ({paths, database}: {paths: string[]; database: string}, {signal}) => {
                try {
                    const data = await Promise.all(
                        paths.map((p) =>
                            window.api.viewer.getDescribe(
                                {
                                    path: p,
                                    database,
                                },
                                {signal},
                            ),
                        ),
                    );
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            keepUnusedDataFor: 0,
            providesTags: ['All'],
        }),
        getOverview: build.query({
            queryFn: async (
                {path, database, timeout}: {path: string; database: string; timeout?: number},
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getDescribe(
                        {
                            path,
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
                const {database, path} = queryArgs;
                return {database, path};
            },
            keepUnusedDataFor: 0,
            providesTags: ['All', 'SchemaTree'],
        }),
    }),
});

const getOverviewSelector = createSelector(
    (path: string) => path,
    (_path: string, database: string) => database,
    (path, database) => overviewApi.endpoints.getOverview.select({path, database}),
);

const selectGetOverview = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string, database: string) => getOverviewSelector(path, database),
    (state, selectOverview) => selectOverview(state).data,
);

const selectOverviewChildren = (state: RootState, path: string, database: string) =>
    selectGetOverview(state, path, database)?.PathDescription?.Children;

export const selectSchemaMergedChildrenPaths = createSelector(
    [
        (_, path: string) => path,
        (_, _path, type: EPathType | undefined) => type,
        (state, path, _type, database: string) => selectOverviewChildren(state, path, database),
    ],
    (path, type, children) => {
        return isEntityWithMergedImplementation(type)
            ? children?.map(({Name}) => path + '/' + Name)
            : undefined;
    },
);

//this hook is done not to refetch mainPath describe for entities with merged implementation
export function useGetMultiOverviewQuery({
    paths,
    database,
    autoRefreshInterval,
}: {
    paths: string[];
    database: string;
    autoRefreshInterval?: number;
}) {
    const [mainPath, ...additionalPaths] = paths;

    const {
        currentData: mainDescribe,
        isFetching: mainDescribeIsFetching,
        error: mainDescribeError,
    } = overviewApi.useGetOverviewQuery(
        {
            path: mainPath,
            database,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const {
        currentData: currentChindrenDescribe,
        isFetching: childrenDescribeIsFetching,
        error: childrenDescribeError,
    } = overviewApi.useGetMultiOverviewQuery(
        additionalPaths.length ? {paths: additionalPaths, database} : skipToken,
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const childrenDescribeLoading =
        childrenDescribeIsFetching && currentChindrenDescribe === undefined;
    const mainDescribeLoading = mainDescribeIsFetching && mainDescribe === undefined;

    const loading = mainDescribeLoading || childrenDescribeLoading;

    const describe = [mainDescribe, ...(currentChindrenDescribe ?? [])];

    const mergedDescribe = describe.reduce<IDescribeData>((acc, item) => {
        if (item?.Path) {
            acc[item.Path] = item;
        }
        return acc;
    }, {});

    return {loading, error: mainDescribeError || childrenDescribeError, mergedDescribe};
}
