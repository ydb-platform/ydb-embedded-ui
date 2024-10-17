import type {Timeout} from '../../../types/api/query';
import {api} from '../api';

export const overviewApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOverview: build.query({
            queryFn: async (
                {
                    paths,
                    database,
                    timeout,
                    concurrentId,
                }: {paths: string[]; database: string; timeout?: Timeout; concurrentId?: string},
                {signal},
            ) => {
                try {
                    const [data, ...additionalData] = await Promise.all(
                        paths.map((p) =>
                            window.api.getDescribe(
                                {
                                    path: p,
                                    database,
                                    timeout,
                                },
                                {signal, concurrentId},
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
