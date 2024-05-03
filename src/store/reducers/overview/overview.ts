import {api} from '../api';

export const overviewApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOverview: build.query({
            queryFn: async (paths: string[], {signal}) => {
                try {
                    const [data, ...additionalData] = await Promise.all(
                        paths.map((p) => window.api.getDescribe({path: p}, {signal})),
                    );
                    return {data: {data, additionalData}};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
});
