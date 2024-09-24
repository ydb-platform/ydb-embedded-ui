import {createSelector} from '@reduxjs/toolkit';

import type {IDescribeData} from '../../../types/store/describe';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

export const overviewApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOverview: build.query({
            queryFn: async ({paths, database}: {paths: string[]; database: string}, {signal}) => {
                try {
                    const [data, ...additionalData] = await Promise.all(
                        paths.map((p) =>
                            window.api.getDescribe(
                                {
                                    path: p,
                                    database,
                                },
                                {signal, concurrentId: 'overview'},
                            ),
                        ),
                    );
                    return {data: {data, additionalData}};
                } catch (error) {
                    return {error};
                }
            },
            keepUnusedDataFor: 0,
            providesTags: ['All'],
        }),
    }),
});

const createGetOverviewSelector = createSelector(
    (paths: string[], database: string) => ({paths, database}),
    (params) => overviewApi.endpoints.getOverview.select(params),
);

const selectPathOverview = createSelector(
    (state: RootState) => state,
    (_state: RootState, paths: string[], database: string) =>
        createGetOverviewSelector(paths, database),
    (state, selectGetOverview) => selectGetOverview(state).data,
);

export const selectPreparedPathOverview = createSelector(selectPathOverview, (rawData) => {
    if (!rawData) {
        return undefined;
    }

    const mergedData = Object.values(rawData).flat();

    const data = mergedData.reduce<IDescribeData>((acc, item) => {
        if (item?.Path) {
            acc[item.Path] = item;
        }
        return acc;
    }, {});
    return data;
});
