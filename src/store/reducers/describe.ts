import type {IDescribeData} from '../../types/store/describe';

import {api} from './api';

export const describeApi = api.injectEndpoints({
    endpoints: (build) => ({
        getDescribe: build.query({
            queryFn: async ({paths, database}: {paths: string[]; database: string}, {signal}) => {
                try {
                    const response = await Promise.all(
                        paths.map((p) => window.api.getDescribe({path: p, database}, {signal})),
                    );
                    const data = response.reduce<IDescribeData>((acc, item) => {
                        if (item?.Path) {
                            acc[item.Path] = item;
                        }
                        return acc;
                    }, {});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
