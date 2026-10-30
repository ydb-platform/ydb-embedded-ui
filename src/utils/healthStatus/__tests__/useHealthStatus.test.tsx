import {configureStore} from '@reduxjs/toolkit';
import {act, renderHook} from '@testing-library/react';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {api} from '../../../store/reducers/api';
import {clustersApi} from '../../../store/reducers/clusters/clusters';
import {tenantApi} from '../../../store/reducers/tenant/tenant';
import {tenantsApi} from '../../../store/reducers/tenants/tenants';
import {EFlag} from '../../../types/api/enums';
import * as healthClock from '../healthClock';
import {getEffectiveHealth, getHealthStatusError, prepareHealthStatus} from '../healthStatus';
import {useHealthStatusNow} from '../useHealthStatusNow';

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({serializableCheck: false}).concat(api.middleware),
    });
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return {promise, resolve, reject};
}

const originalApi = window.api;

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    jest.advanceTimersByTime(1000);
    jest.spyOn(healthClock, 'getHealthStatusNow').mockImplementation(
        healthClock.createHealthClock(),
    );
});

afterEach(() => {
    window.api = originalApi;
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test.each([
    [undefined, undefined],
    [null, undefined],
    [-1, undefined],
    [0.5, undefined],
    [120001, undefined],
    ['1000', undefined],
    [NaN, undefined],
    [Infinity, undefined],
    [0, 1000],
    [1, 1001],
    [120000, 121000],
])('prepares TTL %s conservatively', (ttl, expectedDeadline) => {
    const data = prepareHealthStatus({status_ttl_ms: ttl as number, Overall: EFlag.Green}, 1000);
    expect(data.healthExpiresAt).toBe(expectedDeadline);
    expect(getEffectiveHealth(data, 1000).Overall).toBe(
        expectedDeadline === undefined || expectedDeadline <= 1000 ? EFlag.Grey : EFlag.Green,
    );
});

test('captures the deadline before waiting for the Meta cluster response', async () => {
    const response = deferred<object>();
    window.api = {
        meta: {getClustersList: jest.fn().mockReturnValue(response.promise)},
    } as unknown as YdbEmbeddedAPI;
    const store = createTestStore();
    const request = store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    jest.setSystemTime(2000);
    response.resolve({
        clusters: [
            {name: 'short', cluster: {Overall: EFlag.Green, status_ttl_ms: 5000}},
            {name: 'long', cluster: {Overall: EFlag.Yellow, status_ttl_ms: 10000}},
        ],
    });
    const result = await request;
    expect(result.data?.[0].cluster?.healthExpiresAt).toBe(6000);
    expect(result.data?.[1].cluster?.healthExpiresAt).toBe(11000);
    store.dispatch(api.util.resetApiState());
});

test.each([
    ['list', false],
    ['single', false],
] as const)(
    'switching the Meta %s contract after V2=%s cannot reuse the fulfilled cache entry',
    async (endpoint, initiallyV2) => {
        const tenant = {Name: '/Root/db', Id: 'db', Overall: EFlag.Green};
        const getTenants = jest.fn().mockResolvedValue({TenantInfo: [tenant]});
        const getTenantsV2 = jest
            .fn()
            .mockResolvedValue({TenantInfo: [{...tenant, status_ttl_ms: 5000}]});
        window.api = {meta: {getTenants, getTenantsV2}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();
        const read = async (isMetaDatabasesAvailable: boolean) => {
            const args = {clusterName: 'selected', isMetaDatabasesAvailable};
            if (endpoint === 'list') {
                const result = await store.dispatch(
                    tenantsApi.endpoints.getTenantsInfo.initiate(args),
                );
                return result.data?.[0];
            }
            const result = await store.dispatch(
                tenantApi.endpoints.getTenantInfo.initiate({...args, database: '/Root/db'}),
            );
            return result.data;
        };
        const first = await read(initiallyV2);
        const second = await read(!initiallyV2);
        expect(getTenants).toHaveBeenCalledTimes(1);
        expect(getTenantsV2).toHaveBeenCalledTimes(1);
        expect(first).not.toBe(second);
        const current = initiallyV2 ? first : second;
        const legacy = initiallyV2 ? second : first;
        expect(current).toHaveProperty('healthExpiresAt', 6000);
        expect(legacy).not.toHaveProperty('healthExpiresAt');
        store.dispatch(api.util.resetApiState());
    },
);

test('retains missing cluster data for its existing no-data tooltip', async () => {
    window.api = {
        meta: {
            getClustersList: jest.fn().mockResolvedValue({
                clusters: [{name: 'missing'}],
            }),
        },
    } as unknown as YdbEmbeddedAPI;
    const store = createTestStore();
    const result = await store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    expect(result.data?.[0].cluster).toBeUndefined();
    store.dispatch(api.util.resetApiState());
});

test('normalizes an unknown Meta status before a badge lookup', async () => {
    window.api = {
        meta: {
            getClustersList: jest.fn().mockResolvedValue({
                clusters: [
                    {
                        name: 'future',
                        cluster: {Overall: 'FUTURE_STATUS', status_ttl_ms: 120000},
                    },
                ],
            }),
        },
    } as unknown as YdbEmbeddedAPI;
    const store = createTestStore();
    const response = await store.dispatch(
        clustersApi.endpoints.getClustersList.initiate(undefined),
    );
    const cluster = response.data?.[0]?.cluster;
    if (!cluster) {
        throw new Error('Expected cluster result');
    }
    expect(getEffectiveHealth(cluster, 1000).Overall).toBe(EFlag.Grey);
    store.dispatch(api.util.resetApiState());
});

test.each([
    [{healthExpiresAt: 1000, error: 'entity failure'}, 2000, 'query failure', 'query failure'],
    [{healthExpiresAt: 1000, error: 'entity failure'}, 2000, undefined, 'entity failure'],
    [
        {},
        2000,
        undefined,
        'Healthcheck freshness is unavailable. Refresh to obtain a current result.',
    ],
    [
        {healthExpiresAt: 1000},
        2000,
        undefined,
        'The healthcheck has expired. Refresh to obtain a current result.',
    ],
    [{healthExpiresAt: 3000}, 2000, undefined, undefined],
])('selects the most relevant health explanation', (data, now, error, expected) => {
    expect(getHealthStatusError(data, now, error)).toBe(expected);
});

test('a fresh Meta response recovers after a wall-clock rollback without reviving expired data', async () => {
    window.api = {
        meta: {
            getClustersList: jest.fn().mockResolvedValue({
                clusters: [{name: 'cluster', cluster: {Overall: EFlag.Green, status_ttl_ms: 1000}}],
            }),
        },
    } as unknown as YdbEmbeddedAPI;
    const store = createTestStore();
    const first = await store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    const initial = first.data?.[0].cluster;
    if (!initial) {
        throw new Error('Expected a prepared Meta cluster');
    }
    const mounted = renderHook(
        ({data}) => {
            const now = useHealthStatusNow([data.healthExpiresAt]);
            return {now, cluster: getEffectiveHealth(data, now)};
        },
        {initialProps: {data: initial}},
    );
    act(() => jest.advanceTimersByTime(1000));
    expect(mounted.result.current.cluster.Overall).toBe(EFlag.Grey);
    act(() => jest.setSystemTime(-100000));
    const fresh = await store.dispatch(
        clustersApi.endpoints.getClustersList.initiate(undefined, {forceRefetch: true}),
    );
    if (!fresh.data?.[0].cluster) {
        throw new Error('Expected a refreshed Meta cluster');
    }
    mounted.rerender({data: fresh.data[0].cluster});
    expect(mounted.result.current.cluster.Overall).toBe(EFlag.Green);
    expect(getEffectiveHealth(initial, mounted.result.current.now).Overall).toBe(EFlag.Grey);
    mounted.unmount();
    store.dispatch(api.util.resetApiState());
});
