import type React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {act, renderHook, waitFor} from '@testing-library/react';
import {Provider} from 'react-redux';

import {api} from '../../api';
import {capabilitiesApi} from '../capabilities';
import {useTabletDevUiSecurePath} from '../hooks';

let mockDatabase = '/Root/test';
const mockFetch = jest.fn();

jest.mock('../../../../utils/hooks/useDatabaseFromQuery', () => ({
    useDatabaseFromQuery: () => mockDatabase,
}));
jest.mock('../../../../utils/hooks', () => ({
    useTypedSelector: jest.requireActual('react-redux').useSelector,
}));
jest.mock('../../cluster/cluster', () => ({useClusterBaseInfo: jest.fn()}));
jest.mock('../../../../uiFactory/uiFactory', () => ({uiFactory: {}}));

function createStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefault) => getDefault().concat(api.middleware),
    });
}

let store: ReturnType<typeof createStore>;
const originalApi = Object.getOwnPropertyDescriptor(window, 'api');

function Wrapper({children}: React.PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
}

async function fetchCapabilities(database = mockDatabase) {
    await act(async () => {
        const query = store.dispatch(
            capabilitiesApi.endpoints.getClusterCapabilities.initiate(
                {database},
                {forceRefetch: true},
            ),
        );
        await query;
        query.unsubscribe();
    });
}

const enabled = {
    Capabilities: {},
    Settings: {Features: {EnableTabletDevUiSecurePath: true}},
};

beforeEach(() => {
    store = createStore();
    mockDatabase = '/Root/test';
    mockFetch.mockReset();
    Object.defineProperty(window, 'api', {
        configurable: true,
        value: {viewer: {getClusterCapabilities: mockFetch}},
    });
});

afterEach(() => {
    act(() => {
        store.dispatch(api.util.resetApiState());
    });
    if (originalApi) {
        Object.defineProperty(window, 'api', originalApi);
    } else {
        Reflect.deleteProperty(window, 'api');
    }
});

test.each([
    {Capabilities: {}},
    {Capabilities: {}, Settings: {}},
    {Capabilities: {}, Settings: {Features: {}}},
    {Capabilities: {}, Settings: {Features: {EnableTabletDevUiSecurePath: false}}},
    {Capabilities: {}, Settings: {Features: {EnableTabletDevUiSecurePath: 'true'}}},
])('defaults to plain App unless the flag is explicitly true: %j', async (response) => {
    const {result} = renderHook(useTabletDevUiSecurePath, {wrapper: Wrapper});
    await waitFor(() => expect(result.current).toBe(false));
    mockFetch.mockResolvedValueOnce(response);
    await fetchCapabilities();
    await waitFor(() => expect(result.current).toBe(false));
});

test.each([{status: 404}, {status: 503}, {message: 'Network Error'}])(
    'falls back after an initial failure or a failed refetch: %j',
    async (error) => {
        const {result} = renderHook(useTabletDevUiSecurePath, {wrapper: Wrapper});
        mockFetch.mockRejectedValueOnce(error);
        await fetchCapabilities();
        await waitFor(() => expect(result.current).toBe(false));

        mockFetch.mockResolvedValueOnce(enabled);
        await fetchCapabilities();
        await waitFor(() => expect(result.current).toBe(true));

        mockFetch.mockRejectedValueOnce(error);
        await fetchCapabilities();
        expect(
            capabilitiesApi.endpoints.getClusterCapabilities.select({database: mockDatabase})(
                store.getState(),
            ).data,
        ).toEqual(enabled);
        await waitFor(() => expect(result.current).toBe(false));

        mockFetch.mockResolvedValueOnce(enabled);
        await fetchCapabilities();
        await waitFor(() => expect(result.current).toBe(true));
    },
);

test('retains a known flag while a refetch is pending', async () => {
    const {result} = renderHook(useTabletDevUiSecurePath, {wrapper: Wrapper});
    mockFetch.mockResolvedValueOnce(enabled);
    await fetchCapabilities();

    let resolveRefetch!: (value: typeof enabled) => void;
    mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
            resolveRefetch = resolve;
        }),
    );
    act(() => {
        store.dispatch(
            capabilitiesApi.endpoints.getClusterCapabilities.initiate(
                {database: mockDatabase},
                {forceRefetch: true},
            ),
        );
    });
    await waitFor(() => expect(result.current).toBe(true));

    await act(async () => {
        resolveRefetch(enabled);
        await Promise.all(store.dispatch(capabilitiesApi.util.getRunningQueriesThunk()));
    });
    await waitFor(() => expect(result.current).toBe(true));
});

test('reads the selected database without reusing another database flag', async () => {
    const {result, rerender} = renderHook(useTabletDevUiSecurePath, {wrapper: Wrapper});
    mockFetch.mockResolvedValueOnce(enabled);
    await fetchCapabilities();
    await waitFor(() => expect(result.current).toBe(true));

    mockDatabase = '/Root/another';
    rerender();
    await waitFor(() => expect(result.current).toBe(false));
    mockFetch.mockResolvedValueOnce({Capabilities: {}, Settings: {Features: {}}});
    await fetchCapabilities();
    expect(mockFetch).toHaveBeenLastCalledWith({database: '/Root/another'});
    await waitFor(() => expect(result.current).toBe(false));
});
