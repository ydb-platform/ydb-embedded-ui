import {api} from './api';

interface CheckTraceParams {
    url: string;
}

export const traceApi = api.injectEndpoints({
    endpoints: (build) => ({
        checkTrace: build.query({
            queryFn: async ({url}: CheckTraceParams, {signal}) => {
                try {
                    const response = await window.api.checkTrace({url}, {signal});
                    return {data: response};
                } catch (error) {
                    return {error: error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
