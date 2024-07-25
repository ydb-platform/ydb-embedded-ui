import {api} from '../api';

export const overviewApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOverview: build.query({
            queryFn: async ({paths, database}: {paths: string[]; database: string}, {signal}) => {
                try {
                    const [data, ...additionalData] = await Promise.all(
                        paths.map((p) => window.api.getDescribe({path: p, database}, {signal})),
                    );
                    return {data: {data, additionalData}};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
});
