import {createSelector} from '@reduxjs/toolkit';

import type {AccessRightsUpdateRequest} from '../../../types/api/acl';
import type {RootState} from '../../index';
import {api} from '../api';

export const schemaAclApi = api.injectEndpoints({
    endpoints: (build) => ({
        getSchemaAcl: build.query({
            queryFn: async (
                {
                    path,
                    database,
                    dialect,
                }: {
                    path: string;
                    database: string;
                    dialect: string;
                },
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getSchemaAcl(
                        {path, database, dialect},
                        {signal},
                    );
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
            queryFn: async (
                {
                    database,
                    dialect,
                }: {
                    database: string;
                    dialect: string;
                },
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getAvailablePermissions(
                        {path: database, database, dialect},
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
                dialect: string;
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
    (_path: string, _database: string, dialect: string) => dialect,
    (path, database, dialect) =>
        schemaAclApi.endpoints.getSchemaAcl.select({path, database, dialect}),
);

export const selectSchemaOwner = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string, database: string, dialect: string) =>
        createGetSchemaAclSelector(path, database, dialect),
    (state, selectGetSchemaAcl) => selectGetSchemaAcl(state).data?.owner,
);

const selectAccessRights = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string, database: string, dialect: string) =>
        createGetSchemaAclSelector(path, database, dialect),
    (state, selectGetSchemaAcl) => selectGetSchemaAcl(state).data,
);

const selectRightsMap = createSelector(
    (state: RootState, path: string, database: string, dialect: string) =>
        selectAccessRights(state, path, database, dialect),
    (data) => {
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
    },
);

export const selectPreparedRights = createSelector(
    (state: RootState, path: string, database: string, dialect: string) =>
        selectRightsMap(state, path, database, dialect),
    (data) => {
        if (!data) {
            return null;
        }
        return Object.entries(data).map(([subject, value]) => ({
            subject,
            explicit: Array.from(value.explicit),
            effective: Array.from(value.effective),
        }));
    },
);

export const selectSubjectExplicitRights = createSelector(
    [
        (_state: RootState, subject: string | undefined) => subject,
        (
            state: RootState,
            _subject: string | undefined,
            path: string,
            database: string,
            dialect: string,
        ) => selectRightsMap(state, path, database, dialect),
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
        (
            state: RootState,
            _subject: string | undefined,
            path: string,
            database: string,
            dialect: string,
        ) => selectRightsMap(state, path, database, dialect),
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
    (_database: string, dialect: string) => dialect,
    (database, dialect) =>
        schemaAclApi.endpoints.getAvailablePermissions.select({database, dialect}),
);

// Then create the main selector that extracts the available permissions data
export const selectAvailablePermissions = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string, dialect: string) =>
        createGetAvailablePermissionsSelector(database, dialect),
    (state, selectGetAvailablePermissions) => selectGetAvailablePermissions(state).data,
);
