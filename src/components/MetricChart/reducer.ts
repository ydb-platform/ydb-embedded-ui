import {api} from '../../store/reducers/api';

import {convertResponse} from './convertResponse';
import type {GetChartDataParams} from './getChartData';
import {getChartData} from './getChartData';
import i18n from './i18n';

export const chartApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getChertData: builder.query({
            queryFn: async (params: GetChartDataParams, {signal}) => {
                try {
                    const response = await getChartData(params, {signal});

                    // Response could be a plain html for ydb versions without charts support
                    // Or there could be an error in response with 200 status code
                    // It happens when request is OK, but chart data cannot be returned due to some reason
                    // Example: charts are not enabled in the DB ('GraphShard is not enabled' error)
                    if (Array.isArray(response)) {
                        const preparedData = convertResponse(response, params.metrics);
                        return {data: preparedData};
                    }

                    return {
                        error: new Error(
                            typeof response === 'string' ? i18n('not-supported') : response.error,
                        ),
                    };
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
            keepUnusedDataFor: 0,
        }),
    }),
    overrideExisting: 'throw',
});
