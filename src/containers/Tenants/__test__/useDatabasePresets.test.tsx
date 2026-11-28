import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {act, renderHook} from '@testing-library/react';
import {Provider} from 'react-redux';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {resourcePresetsApi} from '../../../store/reducers/resourcePresets';
import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import {PRESETS_RETRY_DELAYS_MS, useDatabasePresets} from '../useDatabasePresets';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useGetMetaFeatureVersion: () => 1,
}));

const presets = {resource_presets: [{id: 'small', cores: '2', memory: '8'}]};
const rows: PreparedTenant[] = [
    {
        Cluster: 'cluster-a',
        ControlPlane: {resource_preset_id: 'small', scale_policy: {fixed_scale: {size: 1}}},
        controlPlaneName: '',
        sharedTenantName: undefined,
        sharedNodeIds: undefined,
        cpu: undefined,
        memory: undefined,
        storage: undefined,
        nodesCount: 0,
        groupsCount: 0,
    },
];
const [firstDelay, secondDelay] = PRESETS_RETRY_DELAYS_MS;
const ANSWER_MS = 50;

const originalApi = window.api;

async function setup(listResourcePresets: jest.Mock) {
    const store = configureStore({
        reducer: {[resourcePresetsApi.reducerPath]: resourcePresetsApi.reducer},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({serializableCheck: false}).concat(resourcePresetsApi.middleware),
    });
    window.api = {meta: {listResourcePresets}} as unknown as YdbEmbeddedAPI;
    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Provider store={store}>{children}</Provider>
    );
    const hook = renderHook(() => useDatabasePresets(rows), {wrapper});
    const wait = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
    // The store hands an answer over to the hook with a short timer of its own
    const answer = () => wait(ANSWER_MS);
    await answer();
    const refresh = () =>
        act(() => {
            store.dispatch(resourcePresetsApi.util.invalidateTags(['All']));
        });
    return {...hook, wait, answer, refresh};
}

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
    window.api = originalApi;
});

test('asks again about a catalog that failed for a transient reason', async () => {
    const listResourcePresets = jest
        .fn()
        .mockRejectedValueOnce({status: 503})
        .mockRejectedValueOnce({message: 'Network Error'})
        .mockResolvedValue(presets);
    const {result, wait, answer} = await setup(listResourcePresets);

    expect(listResourcePresets).toHaveBeenCalledTimes(1);
    // The catalog is still expected: no flicker of an empty state between the attempts
    expect(result.current.loading).toBe(true);

    await wait(firstDelay);
    expect(listResourcePresets).toHaveBeenCalledTimes(2);
    await answer();
    await wait(secondDelay);
    expect(listResourcePresets).toHaveBeenCalledTimes(3);
    await answer();

    expect(result.current.loading).toBe(false);
    expect(result.current.catalogs.get('cluster-a')?.get('small')).toEqual(
        presets.resource_presets[0],
    );
});

test('counts the attempts anew when the catalog is asked about again', async () => {
    const refreshed = {resource_presets: [{id: 'small', cores: '4', memory: '8'}]};
    const listResourcePresets = jest
        .fn()
        // The first load uses both retries
        .mockRejectedValueOnce({status: 503})
        .mockRejectedValueOnce({status: 503})
        .mockResolvedValueOnce(presets)
        // Refresh fails once
        .mockRejectedValueOnce({status: 503})
        .mockResolvedValue(refreshed);
    const {result, wait, answer, refresh} = await setup(listResourcePresets);
    for (const delay of [firstDelay, secondDelay]) {
        await wait(delay);
        await answer();
    }
    expect(result.current.catalogs.get('cluster-a')?.get('small')?.cores).toBe('2');

    await refresh();
    await answer();
    await wait(firstDelay);
    await answer();

    expect(listResourcePresets).toHaveBeenCalledTimes(5);
    expect(result.current.catalogs.get('cluster-a')?.get('small')?.cores).toBe('4');
});

test('gives up after the last retry', async () => {
    const listResourcePresets = jest.fn().mockRejectedValue({status: 503});
    const {result, wait, answer} = await setup(listResourcePresets);

    for (const delay of [firstDelay, secondDelay, 60_000]) {
        await wait(delay);
        await answer();
    }

    expect(listResourcePresets).toHaveBeenCalledTimes(3);
    expect(result.current.loading).toBe(false);
    expect(result.current.catalogs.size).toBe(0);
});

test('stops asking when the page that needs the catalog is left', async () => {
    const listResourcePresets = jest.fn().mockRejectedValue({status: 503});
    const {unmount, wait} = await setup(listResourcePresets);

    unmount();
    await wait(firstDelay + secondDelay + 60_000);

    expect(listResourcePresets).toHaveBeenCalledTimes(1);
});

test.each([
    ['is refused', {status: 403}],
    ['is refused without CORS headers', {status: 403, message: 'Network Error'}],
])('does not ask again when the request %s', async (_case, error) => {
    const listResourcePresets = jest.fn().mockRejectedValue(error);
    const {result, wait} = await setup(listResourcePresets);

    await wait(firstDelay + secondDelay);

    expect(listResourcePresets).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
});
