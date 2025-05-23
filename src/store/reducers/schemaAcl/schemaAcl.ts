import {api} from '../api';

export const schemaAclApi = api.injectEndpoints({
    endpoints: (build) => ({
        getSchemaAcl: build.query({
            queryFn: async ({path, database}: {path: string; database: string}, {signal}) => {
                try {
                    const data = await window.api.viewer.getSchemaAcl({path, database}, {signal});
                    return {
                        data: {
                            acl: data.Common.ACL,
                            effectiveAcl: data.Common.EffectiveACL,
                            owner: data.Common.Owner,
                            interruptInheritance: data.Common.InterruptInheritance,
                        },
                    };
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['SchemaTree'],
        }),
    }),
    overrideExisting: 'throw',
});
