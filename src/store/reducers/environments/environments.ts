import {serializeReduxError} from '../../../utils/errors/serializeReduxError';
import {api} from '../api';

import {prepareEnvironments} from './utils';

export const environmentsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getMetaEnvironments: builder.query({
            queryFn: async (_) => {
                try {
                    if (!window.api.meta) {
                        throw new Error('Method is not implemented.');
                    }
                    const data = await window.api.meta.getMetaEnvironments();

                    return {data: prepareEnvironments(data)};
                } catch (error) {
                    return {error: serializeReduxError(error)};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
