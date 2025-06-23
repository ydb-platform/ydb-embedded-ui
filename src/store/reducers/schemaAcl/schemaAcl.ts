import {createSelector} from '@reduxjs/toolkit';

import type {AccessRightsUpdateRequest} from '../../../types/api/acl';
import type {RootState} from '../../index';
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
            providesTags: ['All', 'AccessRights'],
        }),
        getAvailablePermissions: build.query({
            queryFn: async ({database}: {database: string}, {signal}) => {
                try {
                    const data = await window.api.viewer.getAvailablePermissions(
                        {path: database, database},
                        {signal},
                    );

                    return {
                        data: data.AvailablePermissions,
                    };
                } catch (error) {
                    return {error};
                }
            },
        }),
        updateAccess: build.mutation({
            queryFn: async (props: {
                database: string;
                path: string;
                rights: AccessRightsUpdateRequest;
            }) => {
                try {
                    const data = await window.api.viewer.updateAccessRights(props);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_, error) => (error ? [] : ['AccessRights']),
        }),
    }),
    overrideExisting: 'throw',
});

const createGetSchemaAclSelector = createSelector(
    (path: string) => path,
    (_path: string, database: string) => database,
    (path, database) => schemaAclApi.endpoints.getSchemaAcl.select({path, database}),
);

export const selectSchemaOwner = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string, database: string) =>
        createGetSchemaAclSelector(path, database),
    (state, selectGetSchemaAcl) => selectGetSchemaAcl(state).data?.owner,
);

const selectAccessRights = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string, database: string) =>
        createGetSchemaAclSelector(path, database),
    (state, selectGetSchemaAcl) => selectGetSchemaAcl(state).data,
);

const selectRightsMap = createSelector(selectAccessRights, (data) => {
    if (!data) {
        return null;
    }
    const {acl, effectiveAcl} = data;

    const result: Record<string, {explicit: Set<string>; effective: Set<string>}> = {};

    if (acl?.length) {
        acl.forEach((aclItem) => {
            if (aclItem.Subject) {
                if (!result[aclItem.Subject]) {
                    result[aclItem.Subject] = {explicit: new Set(), effective: new Set()};
                }
                aclItem.AccessRules?.forEach((rule) => {
                    result[aclItem.Subject].explicit.add(rule);
                });
                aclItem.AccessRights?.forEach((rule) => {
                    result[aclItem.Subject].explicit.add(rule);
                });
            }
        });
    }

    if (effectiveAcl?.length) {
        effectiveAcl.forEach((aclItem) => {
            if (aclItem.Subject) {
                if (!result[aclItem.Subject]) {
                    result[aclItem.Subject] = {explicit: new Set(), effective: new Set()};
                }
                aclItem.AccessRules?.forEach((rule) => {
                    result[aclItem.Subject].effective.add(rule);
                });
                aclItem.AccessRights?.forEach((rule) => {
                    result[aclItem.Subject].effective.add(rule);
                });
            }
        });
    }

    return result;
});

export const selectPreparedRights = createSelector(selectRightsMap, (data) => {
    if (!data) {
        return null;
    }
    return Object.entries(data).map(([subject, value]) => ({
        subject,
        explicit: Array.from(value.explicit),
        effective: Array.from(value.effective),
    }));
});

export const selectSubjectExplicitRights = createSelector(
    [
        (_state: RootState, subject: string | undefined) => subject,
        (state: RootState, _subject: string | undefined, path: string, database: string) =>
            selectRightsMap(state, path, database),
    ],
    (subject, rightsMap) => {
        if (!subject || !rightsMap) {
            return [];
        }

        const explicitRights = rightsMap[subject]?.explicit || new Set();

        return Array.from(explicitRights);
    },
);
export const selectSubjectInheritedRights = createSelector(
    [
        (_state: RootState, subject: string | undefined) => subject,
        (state: RootState, _subject: string | undefined, path: string, database: string) =>
            selectRightsMap(state, path, database),
    ],
    (subject, rightsMap) => {
        if (!subject || !rightsMap) {
            return new Set<string>();
        }

        const explicitRights = rightsMap[subject]?.explicit || new Set();
        const effectiveRights = rightsMap[subject]?.effective || new Set();
        const inheritedRights = Array.from(effectiveRights).filter(
            (right) => !explicitRights.has(right),
        );

        return new Set(inheritedRights);
    },
);

const createGetAvailablePermissionsSelector = createSelector(
    (database: string) => database,
    (database) => schemaAclApi.endpoints.getAvailablePermissions.select({database}),
);

// Then create the main selector that extracts the available permissions data
export const selectAvailablePermissions = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string) => createGetAvailablePermissionsSelector(database),
    (state, selectGetAvailablePermissions) => selectGetAvailablePermissions(state).data,
);
