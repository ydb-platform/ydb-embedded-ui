import {api} from '../api';

export const schemaAclApi = api.injectEndpoints({
    endpoints: (build) => ({
        getSchemaAcl: build.query({
            queryFn: async ({path}: {path: string}, {signal}) => {
                try {
                    const data = await window.api.getSchemaAcl({path}, {signal});
                    return {data: {acl: data.Common.ACL, owner: data.Common.Owner}};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
