import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {act, renderHook, waitFor} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {YdbEmbeddedAPI} from '../../../services/api';
import {authenticationApi} from '../../../store/reducers/authentication/authentication';
import {configureUIFactory, uiFactory} from '../../../uiFactory/uiFactory';
import {useIsUserAllowedToMakeChanges} from '../useWhoami';

const originalApi = window.api;
const originalEmMetaAvailable = uiFactory.emMetaAvailable;

beforeEach(() => {
    configureUIFactory({emMetaAvailable: true});
    window.api = new YdbEmbeddedAPI({
        webVersion: true,
        singleClusterMode: false,
        withCredentials: false,
        proxyMeta: false,
        useRelativePath: false,
        useMetaSettings: false,
        csrfTokenGetter: undefined,
        defaults: undefined,
    });
});

afterEach(() => {
    jest.restoreAllMocks();
    window.api = originalApi;
    configureUIFactory({emMetaAvailable: originalEmMetaAvailable});
});

test.each([
    {metaAllowed: false, clusterAllowed: true},
    {metaAllowed: true, clusterAllowed: false},
])('uses the current page identity: %o', async ({metaAllowed, clusterAllowed}) => {
    if (!window.api.meta) {
        throw new Error('Meta API is required');
    }
    const metaWhoami = jest
        .spyOn(window.api.meta, 'metaWhoami')
        .mockResolvedValue({IsMonitoringAllowed: metaAllowed});
    const clusterWhoami = jest
        .spyOn(window.api.viewer, 'whoami')
        .mockResolvedValue({IsMonitoringAllowed: clusterAllowed});
    const store = configureStore({
        reducer: {[authenticationApi.reducerPath]: authenticationApi.reducer},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(authenticationApi.middleware),
    });
    const history = createMemoryHistory({initialEntries: ['/home/clusters']});
    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Provider store={store}>
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>{children}</QueryParamProvider>
            </Router>
        </Provider>
    );
    const {result, unmount} = renderHook(useIsUserAllowedToMakeChanges, {wrapper});
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe(metaAllowed));
    expect(metaWhoami).toHaveBeenCalledTimes(1);
    expect(clusterWhoami).not.toHaveBeenCalled();

    act(() => history.push('/cluster/databases?clusterName=test-cluster'));
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe(clusterAllowed));
    expect(clusterWhoami).toHaveBeenCalledWith({database: undefined});

    act(() => history.push('/database?database=/local&clusterName=test-cluster'));
    await waitFor(() => expect(result.current).toBe(clusterAllowed));
    expect(clusterWhoami).toHaveBeenCalledWith({database: '/local'});

    act(() => history.push('/home/clusters'));
    expect(result.current).toBe(metaAllowed);
    expect(metaWhoami).toHaveBeenCalledTimes(1);
    unmount();
    store.dispatch(authenticationApi.util.resetApiState());
});
