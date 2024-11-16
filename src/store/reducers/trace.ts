import {api} from './api';
import {setQueryTraceReady} from './executeQuery';

interface CheckTraceParams {
    url: string;
}

export const traceApi = api.injectEndpoints({
    endpoints: (build) => ({
        checkTrace: build.query({
            queryFn: async ({url}: CheckTraceParams, {signal, dispatch}) => {
                try {
                    const response = await window.api.checkTrace({url}, {signal});

                    dispatch(setQueryTraceReady());
                    return {data: response};
                } catch (error) {
                    return {error: error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
