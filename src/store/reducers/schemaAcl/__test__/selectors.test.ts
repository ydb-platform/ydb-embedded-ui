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
    const selectorArgs = [
        args.path,
        args.database,
        args.databaseFullPath,
        args.dialect,
        args.useMetaProxy,
    ] as const;

    try {
        expect(selectPreparedRights(store.getState(), ...selectorArgs)).toBeNull();
        await store.dispatch(
            schemaAclApi.util.upsertQueryData('getSchemaAcl', args, {
                acl: [
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRules: ['select'],
                        AccessRights: ['select'],
                    },
                    {Subject: 'alice', AccessType: 'Deny', AccessRights: ['update']},
                ],
                effectiveAcl: [
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRights: ['select', 'describe_schema'],
                    },
                    {Subject: 'inherited', AccessType: 'Allow', AccessRules: ['select']},
                ],
                owner: 'owner',
                interruptInheritance: false,
            }),
        );

        expect(selectPreparedRights(store.getState(), ...selectorArgs)).toEqual([
            {
                subject: 'alice',
                explicit: ['select', 'update'],
                effective: ['select', 'describe_schema'],
            },
            {subject: 'inherited', explicit: [], effective: ['select']},
        ]);
        expect(selectSubjectExplicitRights(store.getState(), 'alice', ...selectorArgs)).toEqual([
            'select',
        ]);
        expect(selectSubjectInheritedRights(store.getState(), 'alice', ...selectorArgs)).toEqual(
            new Set(['describe_schema']),
        );
        expect(
            selectSubjectInheritedRights(store.getState(), 'inherited', ...selectorArgs),
        ).toEqual(new Set(['select']));
        expect(selectSubjectInheritedRights(store.getState(), 'missing', ...selectorArgs)).toEqual(
            new Set(),
        );
        expect(
            selectPreparedRights(
                store.getState(),
                '/Root/other',
                args.database,
                args.databaseFullPath,
                args.dialect,
                args.useMetaProxy,
            ),
        ).toBeNull();

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
