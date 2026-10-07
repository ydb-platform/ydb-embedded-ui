import {configureStore} from '@reduxjs/toolkit';

import {storageApi} from './storage';

test.each(['backend', 'clusterName', 'environment'] as const)(
    'tablet group cache is isolated by %s',
    async (key) => {
        const store = configureStore({
            reducer: {[storageApi.reducerPath]: storageApi.reducer},
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware().concat(storageApi.middleware),
        });
        const scope = {tabletId: '41', backend: '/a', clusterName: 'alpha', environment: 'prod'};
        const data = {groups: [{DirectBlockGroupId: 0, Degrade: 1}], disks: []};
        await store.dispatch(storageApi.util.upsertQueryData('getNbsTabletDetails', scope, data));
        expect(
            storageApi.endpoints.getNbsTabletDetails.select(scope)(store.getState()).data,
        ).toEqual(data);
        expect(
            storageApi.endpoints.getNbsTabletDetails.select({...scope, [key]: 'other'})(
                store.getState(),
            ).data,
        ).toBeUndefined();
        store.dispatch(storageApi.util.resetApiState());
    },
);
