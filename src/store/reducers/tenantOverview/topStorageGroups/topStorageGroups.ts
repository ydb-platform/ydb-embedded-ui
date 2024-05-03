import {EVersion} from '../../../../types/api/storage';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {api} from '../../api';
import type {StorageApiRequestParams} from '../../storage/types';

import {prepareTopStorageGroupsResponse} from './utils';

export const topStorageGroupsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTopStorageGroups: builder.query({
            queryFn: async (params: StorageApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.getStorageInfo(
                        {
                            visibleEntities: 'all',
                            sortOrder: -1,
                            sortValue: 'Usage',
                            limit: TENANT_OVERVIEW_TABLES_LIMIT,
                            version: EVersion.v2,
                            ...params,
                        },
                        {signal},
                    );
                    return {data: prepareTopStorageGroupsResponse(data).groups || []};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
