import {createSelector} from '@reduxjs/toolkit';

import type {AccessRightsUpdateRequest} from '../../../types/api/acl';
import {prepareAccessRights} from '../../../utils/prepareAccessRights';
import type {RootState} from '../../index';
import {api} from '../api';

import {getSubjectExplicitAllowAces} from './utils';

export const schemaAclApi = api.injectEndpoints({
    endpoints: (build) => ({
        getSchemaAcl: build.query({
            queryFn: async (
                {
                    path,
                    database,
                    dialect,
                    databaseFullPath,
                    useMetaProxy,
                }: {
                    path: string;
                    database: string;
                    dialect: string;
                    databaseFullPath: string;
                    useMetaProxy?: boolean;
                },
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getSchemaAcl(
                        {path: {path, databaseFullPath, useMetaProxy}, database, dialect},
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
                    databaseFullPath,
                    useMetaProxy,
                }: {
                    database: string;
                    databaseFullPath: string;
                    dialect: string;
                    useMetaProxy?: boolean;
                },
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getAvailablePermissions(
                        {
                            path: {path: databaseFullPath, databaseFullPath, useMetaProxy},
                            database,
                            dialect,
                        },
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
            queryFn: async ({
                database,
                databaseFullPath,
                path,
                rights,
                dialect,
                useMetaProxy,
            }: {
                database: string;
                databaseFullPath: string;
                path: string;
                rights: AccessRightsUpdateRequest;
                dialect: string;
                useMetaProxy?: boolean;
            }) => {
                try {
                    const data = await window.api.viewer.updateAccessRights({
                        database,
                        rights,
                        dialect,
                        path: {path, databaseFullPath, useMetaProxy},
                    });
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
    (_path: string, _database: string, databaseFullPath: string) => databaseFullPath,
    (_path: string, _database: string, _databaseFullPath: string, dialect: string) => dialect,
    (
        _path: string,
        _database: string,
        _databaseFullPath: string,
        _dialect: string,
        useMetaProxy?: boolean,
    ) => useMetaProxy,
    (path, database, databaseFullPath, dialect, useMetaProxy) =>
        schemaAclApi.endpoints.getSchemaAcl.select({
            path,
            database,
            databaseFullPath,
            dialect,
            useMetaProxy,
        }),
);

export const selectSchemaOwner = createSelector(
    (state: RootState) => state,
    (
        _state: RootState,
        path: string,
        database: string,
        databaseFullPath: string,
        dialect: string,
        useMetaProxy?: boolean,
    ) => createGetSchemaAclSelector(path, database, databaseFullPath, dialect, useMetaProxy),
    (state, selectGetSchemaAcl) => selectGetSchemaAcl(state).data?.owner,
);

const selectAccessRights = createSelector(
    (state: RootState) => state,
    (
        _state: RootState,
        path: string,
        database: string,
        databaseFullPath: string,
        dialect: string,
        useMetaProxy?: boolean,
    ) => createGetSchemaAclSelector(path, database, databaseFullPath, dialect, useMetaProxy),
    (state, selectGetSchemaAcl) => selectGetSchemaAcl(state).data,
);

export const selectSubjectExplicitAllowAces = createSelector(
    [
        (_state: RootState, subject: string | undefined) => subject,
        (
            state: RootState,
            _subject: string | undefined,
            path: string,
            database: string,
            databaseFullPath: string,
            dialect: string,
            useMetaProxy?: boolean,
        ) => selectAccessRights(state, path, database, databaseFullPath, dialect, useMetaProxy),
    ],
    (subject, data) => getSubjectExplicitAllowAces(data?.acl, subject),
);

export const selectPreparedRights = createSelector(
    (
        state: RootState,
        path: string,
        database: string,
        databaseFullPath: string,
        dialect: string,
        useMetaProxy?: boolean,
    ) => selectAccessRights(state, path, database, databaseFullPath, dialect, useMetaProxy),
    (data) => (data ? prepareAccessRights(data.acl, data.effectiveAcl) : null),
);

export const selectSubjectExplicitRights = createSelector(
    [
        (_state: RootState, subject: string | undefined) => subject,
        (
            state: RootState,
            _subject: string | undefined,
            path: string,
            database: string,
            databaseFullPath: string,
            dialect: string,
            useMetaProxy?: boolean,
        ) => selectAccessRights(state, path, database, databaseFullPath, dialect, useMetaProxy),
    ],
    (subject, data) => {
        const explicitRights = new Set<string>();
        getSubjectExplicitAllowAces(data?.acl, subject).forEach((ace) => {
            ace.AccessRules?.forEach((right) => explicitRights.add(right));
            ace.AccessRights?.forEach((right) => explicitRights.add(right));
        });

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
            databaseFullPath: string,
            dialect: string,
            useMetaProxy?: boolean,
        ) => selectPreparedRights(state, path, database, databaseFullPath, dialect, useMetaProxy),
    ],
    (subject, rights) => {
        const subjectRights = rights?.find((row) => row.subject === subject);
        if (!subjectRights) {
            return new Set<string>();
        }

        const explicitRights = new Set(subjectRights.explicit);
        const inheritedRights = subjectRights.effective.filter(
            (right) => !explicitRights.has(right),
        );

        return new Set(inheritedRights);
    },
);

const createGetAvailablePermissionsSelector = createSelector(
    (database: string) => database,
    (_database: string, databaseFullPath: string) => databaseFullPath,
    (_database: string, _databaseFullPath: string, dialect: string) => dialect,
    (_database: string, _databaseFullPath: string, _dialect: string, useMetaProxy?: boolean) =>
        useMetaProxy,
    (database, databaseFullPath, dialect, useMetaProxy) =>
        schemaAclApi.endpoints.getAvailablePermissions.select({
            database,
            dialect,
            databaseFullPath,
            useMetaProxy,
        }),
);

// Then create the main selector that extracts the available permissions data
export const selectAvailablePermissions = createSelector(
    (state: RootState) => state,
    (
        _state: RootState,
        database: string,
        databaseFullPath: string,
        dialect: string,
        useMetaProxy?: boolean,
    ) => createGetAvailablePermissionsSelector(database, databaseFullPath, dialect, useMetaProxy),
    (state, selectGetAvailablePermissions) => selectGetAvailablePermissions(state).data,
);
