import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {act, render, screen, waitFor} from '@testing-library/react';
import {Provider} from 'react-redux';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {api} from '../../../store/reducers/api';
import authentication from '../../../store/reducers/authentication/authentication';
import {AppTitleProvider} from '../../App/AppTitleContext';
import {GetUser} from '../GetUserWrapper';

jest.mock('../../../utils/hooks/useDatabaseFromQuery', () => ({
    useDatabaseFromQuery: () => '/db',
}));
jest.mock('../../App/SettingsBootstrap', () => ({
    SettingsBootstrap: ({children}: {children: React.ReactNode}) => children,
}));

const INACTIVE_TIMEOUT = 5 * 60 * 1000;

const originalApi = window.api;
let now = 0;

beforeEach(() => {
    now = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
});

afterEach(() => {
    jest.restoreAllMocks();
    window.api = originalApi;
});

function setVisibility(state: DocumentVisibilityState) {
    Object.defineProperty(document, 'visibilityState', {value: state, configurable: true});
    document.dispatchEvent(new Event('visibilitychange'));
}

function deferred<T>() {
    let resolve: (value: T) => void = () => undefined;
    let reject: (error: unknown) => void = () => undefined;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {promise, resolve, reject};
}

function Page({onMount}: {onMount: () => void}) {
    React.useEffect(onMount, [onMount]);
    return <div>page content</div>;
}

function renderGetUser(whoami: jest.Mock) {
    window.api = {viewer: {whoami}} as unknown as YdbEmbeddedAPI;
    const store = configureStore({
        reducer: {authentication, [api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
        // Notify subscribers synchronously, so the UI state during the refetch is observable
        enhancers: (getDefaultEnhancers) => getDefaultEnhancers({autoBatch: false}),
    });
    const onMount = jest.fn();
    render(
        <Provider store={store}>
            <AppTitleProvider appTitle="YDB">
                <GetUser>
                    <Page onMount={onMount} />
                </GetUser>
            </AppTitleProvider>
        </Provider>,
    );
    return {onMount};
}

function returnToTabAfterInactivity() {
    act(() => setVisibility('hidden'));
    now += INACTIVE_TIMEOUT;
    act(() => setVisibility('visible'));
}

test('revalidation after inactivity keeps the page mounted', async () => {
    const revalidation = deferred<unknown>();
    const whoami = jest
        .fn()
        .mockResolvedValueOnce({UserSID: 'user'})
        .mockReturnValueOnce(revalidation.promise);
    const {onMount} = renderGetUser(whoami);

    expect(await screen.findByText('page content')).toBeVisible();
    expect(onMount).toHaveBeenCalledTimes(1);

    returnToTabAfterInactivity();
    expect(whoami).toHaveBeenCalledTimes(2);
    // The request is still in flight, the page stays as it is
    expect(screen.getByText('page content')).toBeVisible();

    await act(async () => revalidation.resolve({UserSID: 'user'}));
    expect(screen.getByText('page content')).toBeVisible();
    expect(onMount).toHaveBeenCalledTimes(1);
});

test('a failed revalidation still replaces the page with the error', async () => {
    const revalidation = deferred<unknown>();
    const whoami = jest
        .fn()
        .mockResolvedValueOnce({UserSID: 'user'})
        .mockReturnValueOnce(revalidation.promise);
    renderGetUser(whoami);
    expect(await screen.findByText('page content')).toBeVisible();

    returnToTabAfterInactivity();
    await act(async () => revalidation.reject({status: 403, statusText: 'Forbidden'}));

    await waitFor(() => expect(screen.queryByText('page content')).not.toBeInTheDocument());
});
