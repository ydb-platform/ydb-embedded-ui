import type {TelemetryOpenTabs} from '../../services/codeCompletion';

import {api} from './api';

export const codeAssistApi = api.injectEndpoints({
    endpoints: (build) => ({
        sendOpenTabs: build.mutation({
            queryFn: async (params: TelemetryOpenTabs) => {
                try {
                    const data = await window.api.codeAssistant?.sendCodeAssistOpenTabs(params);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});

export const {useSendOpenTabsMutation} = codeAssistApi;
