import {configureStore} from '@reduxjs/toolkit';

import reducer from '../..';
import {api} from '../../api';
import {
    schemaAclApi,
    selectPreparedRights,
    selectSubjectExplicitRights,
    selectSubjectInheritedRights,
} from '../schemaAcl';

test('prepares cached ACL for the table and preserves explicit-allow and inherited selectors', async () => {
    const store = configureStore({
        reducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
    const args = {
        path: '/Root/table',
        database: 'database-id',
        databaseFullPath: '/Root',
        dialect: 'ydb',
        useMetaProxy: true,
    };
    const scope = [args.database, args.databaseFullPath, args.dialect, args.useMetaProxy] as const;
    const selectorArgs = [args.path, ...scope] as const;

    try {
        await store.dispatch(
            schemaAclApi.util.upsertQueryData('getSchemaAcl', args, {
                acl: [
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRules: ['select'],
                    },
                    {Subject: 'alice', AccessType: 'Deny', AccessRights: ['update']},
                ],
                effectiveAcl: [
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRights: ['select', 'update', 'describe_schema'],
                    },
                ],
                owner: 'owner',
                interruptInheritance: false,
            }),
        );

        expect(selectPreparedRights(store.getState(), ...selectorArgs)).toEqual([
            {
                subject: 'alice',
                explicit: ['select', 'update'],
                effective: ['select', 'update', 'describe_schema'],
            },
        ]);
        expect(selectSubjectExplicitRights(store.getState(), 'alice', ...selectorArgs)).toEqual([
            'select',
        ]);
        expect(selectSubjectInheritedRights(store.getState(), 'alice', ...selectorArgs)).toEqual(
            new Set(['describe_schema']),
        );
        expect(selectPreparedRights(store.getState(), '/Root/other', ...scope)).toBeNull();

        await store.dispatch(
            schemaAclApi.util.upsertQueryData('getSchemaAcl', args, {
                acl: [],
                effectiveAcl: [],
                owner: 'owner',
                interruptInheritance: false,
            }),
        );
        expect(selectPreparedRights(store.getState(), ...selectorArgs)).toEqual([]);
        expect(selectSubjectInheritedRights(store.getState(), 'alice', ...selectorArgs)).toEqual(
            new Set(),
        );
    } finally {
        store.dispatch(api.util.resetApiState());
    }
});
