import type {BaseQueryFn, EndpointBuilder} from '@reduxjs/toolkit/query';

import {api} from './api';

interface CheckTraceParams {
    url?: string;
}

function endpoints(build: EndpointBuilder<BaseQueryFn, string, string>) {
    return {
        checkTrace: build.query({
            queryFn: async ({url}: CheckTraceParams, {signal}) => {
                try {
                    if (!url) {
                        throw new Error('no tracecheck url provided');
                    }
                    const response = await window.api.checkTrace({url}, {signal});
                    return {data: response};
                } catch (error) {
                    return {error: error};
                }
            },
        }),
    };
}

export const traceApi = api.injectEndpoints({endpoints});
