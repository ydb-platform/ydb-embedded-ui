import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {act, renderHook, waitFor} from '@testing-library/react';
import {Provider, useSelector} from 'react-redux';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {api} from '../../../store/reducers/api';
import {clustersApi} from '../../../store/reducers/clusters/clusters';
import {healthcheckApi} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {tenantApi} from '../../../store/reducers/tenant/tenant';
import {tenantsApi} from '../../../store/reducers/tenants/tenants';
import {EFlag} from '../../../types/api/enums';
import {SelfCheckResult} from '../../../types/api/healthcheck';
import {getEffectiveHealth, getHealthStatusError} from '../healthStatus';
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
    jest.setSystemTime(1000);
});

afterEach(() => {
    window.api = originalApi;
    jest.useRealTimers();
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
])('prepares the actual cluster query TTL %s once', async (ttl, expectedDeadline) => {
    window.api = {
        meta: {
            getClustersList: jest.fn().mockResolvedValue({
                clusters: [{name: 'cluster', cluster: {Overall: EFlag.Green, status_ttl_ms: ttl}}],
            }),
        },
    } as unknown as YdbEmbeddedAPI;
    const store = createTestStore();
    const query = store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    const result = await query;
    expect(result.data?.[0].cluster).toHaveProperty('healthExpiresAt', expectedDeadline);
    jest.setSystemTime(60000);
    const cached = await store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    expect(cached.data).toBe(result.data);
    expect(cached.data?.[0].cluster).toHaveProperty('healthExpiresAt', expectedDeadline);
    query.unsubscribe();
    store.dispatch(api.util.resetApiState());
});

test('captures deadlines at request start across Meta adapters without renewing each item', async () => {
    const clusterResponse = deferred<object>();
    const databaseResponse = {
        TenantInfo: [
            {
                Name: '/Root/db',
                Id: 'db',
                Type: 'Serverless',
                Overall: EFlag.Green,
                status_ttl_ms: 5000,
            },
        ],
    };
    window.api = {
        meta: {
            getClustersList: jest.fn().mockReturnValue(clusterResponse.promise),
            getClusterHealth: jest
                .fn()
                .mockResolvedValue({self_check_result: SelfCheckResult.GOOD, status_ttl_ms: 5000}),
            getTenantsV2: jest.fn().mockResolvedValue(databaseResponse),
        },
    } as unknown as YdbEmbeddedAPI;
    const store = createTestStore();
    const request = store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    jest.setSystemTime(2000);
    clusterResponse.resolve({
        clusters: [
            {name: 'short', cluster: {Overall: EFlag.Green, status_ttl_ms: 5000}},
            {name: 'long', cluster: {Overall: EFlag.Yellow, status_ttl_ms: 10000}},
        ],
    });
    const result = await request;
    expect(result.data?.[0].cluster).toHaveProperty('healthExpiresAt', 6000);
    expect(result.data?.[1].cluster).toHaveProperty('healthExpiresAt', 11000);
    const health = await store.dispatch(
        healthcheckApi.endpoints.getClusterHealthcheckInfo.initiate({clusterName: 'selected'}),
    );
    expect(health.data).toHaveProperty('healthExpiresAt', 7000);
    const list = await store.dispatch(
        tenantsApi.endpoints.getTenantsInfo.initiate({
            clusterName: 'selected',
            isMetaDatabasesAvailable: true,
        }),
    );
    expect(list.data?.[0]).toHaveProperty('healthExpiresAt', 7000);
    const single = await store.dispatch(
        tenantApi.endpoints.getTenantInfo.initiate({
            database: '/Root/db',
            clusterName: 'selected',
            isMetaDatabasesAvailable: true,
        }),
    );
    expect(single.data).toHaveProperty('healthExpiresAt', 7000);
    store.dispatch(api.util.resetApiState());
});

test.each([
    ['list', false],
    ['list', true],
    ['single', false],
    ['single', true],
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
        if (!current || !legacy) {
            throw new Error('Expected both database contracts');
        }
        expect(getEffectiveHealth(current, 6000, {message: 'refresh failed'}).Overall).toBe(
            EFlag.Grey,
        );
        expect(getEffectiveHealth(legacy, 6000, {message: 'refresh failed'}).Overall).toBe(
            EFlag.Green,
        );
        if (endpoint === 'single') {
            expect(
                tenantApi.endpoints.getTenantInfo.select({
                    clusterName: 'selected',
                    database: '/Root/db',
                    isMetaDatabasesAvailable: !initiallyV2,
                })(store.getState()).data,
            ).toBe(second);
        }
        store.dispatch(api.util.resetApiState());
    },
);

test('retains issues and Unknown during a failed refresh and pending retry, then recovers in its own scope', async () => {
    // Feature hooks load after store modules in the application's lazy entry.
    const {useClusterHealthcheck} = await import(
        '../../../containers/Tenant/Healthcheck/useHealthcheck'
    );
    const issue = {id: 'disk', message: 'Disk failure'};
    const getClusterHealth = jest.fn().mockResolvedValue({
        self_check_result: SelfCheckResult.GOOD,
        status_ttl_ms: 120000,
        issue_log: [issue],
    });
    window.api = {meta: {getClusterHealth}} as unknown as YdbEmbeddedAPI;
    const store = createTestStore();
    await store.dispatch(
        healthcheckApi.endpoints.getClusterHealthcheckInfo.initiate({clusterName: 'first'}),
    );
    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Provider store={store}>{children}</Provider>
    );
    const {result, rerender, unmount} = renderHook(
        ({cluster}) => {
            const healthcheck = useClusterHealthcheck(cluster);
            const queryStatus = useSelector(
                (state: ReturnType<typeof store.getState>) =>
                    healthcheckApi.endpoints.getClusterHealthcheckInfo.select({
                        clusterName: cluster,
                    })(state).status,
            );
            return {...healthcheck, queryStatus};
        },
        {initialProps: {cluster: 'first'}, wrapper},
    );
    expect(result.current.selfCheckResult).toBe(SelfCheckResult.GOOD);
    const failure = deferred<object>();
    getClusterHealth.mockReturnValueOnce(failure.promise);
    let refresh!: PromiseLike<unknown>;
    act(() => {
        refresh = store.dispatch(
            healthcheckApi.endpoints.getClusterHealthcheckInfo.initiate(
                {clusterName: 'first'},
                {forceRefetch: true},
            ),
        );
    });
    await waitFor(() => expect(result.current.queryStatus).toBe('pending'));
    expect(result.current.selfCheckResult).toBe(SelfCheckResult.GOOD);
    await act(async () => {
        failure.reject({status: 400, statusText: 'Bad Request'});
        await refresh;
    });
    expect(
        healthcheckApi.endpoints.getClusterHealthcheckInfo.select({clusterName: 'first'})(
            store.getState(),
        ).error,
    ).toMatchObject({status: 400});
    await waitFor(() => expect(result.current.queryStatus).toBe('rejected'));
    expect(result.current.selfCheckResult).toBe(SelfCheckResult.UNSPECIFIED);
    expect(result.current.issues).toEqual([issue]);
    const retry = deferred<object>();
    getClusterHealth.mockReturnValueOnce(retry.promise);
    act(() => {
        refresh = store.dispatch(
            healthcheckApi.endpoints.getClusterHealthcheckInfo.initiate(
                {clusterName: 'first'},
                {forceRefetch: true},
            ),
        );
    });
    await waitFor(() => expect(result.current.queryStatus).toBe('pending'));
    expect(result.current.selfCheckResult).toBe(SelfCheckResult.UNSPECIFIED);
    await act(async () => {
        retry.resolve({
            self_check_result: SelfCheckResult.DEGRADED,
            status_ttl_ms: 120000,
            issue_log: [issue],
        });
        await refresh;
    });
    await waitFor(() => expect(result.current.selfCheckResult).toBe(SelfCheckResult.DEGRADED));
    expect(result.current.error).toBeUndefined();
    const firstDeadline = healthcheckApi.endpoints.getClusterHealthcheckInfo.select({
        clusterName: 'first',
    })(store.getState()).data?.healthExpiresAt;
    jest.setSystemTime(2000);
    getClusterHealth.mockResolvedValueOnce({
        self_check_result: SelfCheckResult.EMERGENCY,
        status_ttl_ms: 1000,
        issue_log: [],
    });
    await act(async () => {
        rerender({cluster: 'second'});
    });
    await waitFor(() => expect(result.current.selfCheckResult).toBe(SelfCheckResult.EMERGENCY));
    expect(result.current.issues).toEqual([]);
    expect(
        healthcheckApi.endpoints.getClusterHealthcheckInfo.select({clusterName: 'first'})(
            store.getState(),
        ).data,
    ).toHaveProperty('healthExpiresAt', firstDeadline);
    unmount();
    store.dispatch(api.util.resetApiState());
});

test('mounted clock expires cached results, does not renew on remount, resumes immediately and cleans up', async () => {
    window.api = {
        meta: {
            getClustersList: jest.fn().mockResolvedValue({
                clusters: [
                    {name: 'short', cluster: {Overall: EFlag.Green, status_ttl_ms: 2000}},
                    {name: 'long', cluster: {Overall: EFlag.Green, status_ttl_ms: 10000}},
                ],
            }),
        },
    } as unknown as YdbEmbeddedAPI;
    const store = createTestStore();
    const query = await store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    const short = query.data?.[0]?.cluster;
    const long = query.data?.[1]?.cluster;
    if (!short || !long) {
        throw new Error('Expected both prepared cluster responses');
    }
    const interval = jest.spyOn(window, 'setInterval');
    const clearInterval = jest.spyOn(window, 'clearInterval');
    const mounted = renderHook(() => {
        const now = useHealthStatusNow();
        return {now, short: getEffectiveHealth(short, now), long: getEffectiveHealth(long, now)};
    });
    expect(mounted.result.current.short.Overall).toBe(EFlag.Green);
    act(() => {
        jest.advanceTimersByTime(1999);
    });
    expect(mounted.result.current.short.Overall).toBe(EFlag.Green);
    act(() => {
        jest.advanceTimersByTime(1);
    });
    expect(mounted.result.current.short.Overall).toBe(EFlag.Grey);
    expect(mounted.result.current.long.Overall).toBe(EFlag.Green);
    const firstTimer = interval.mock.results.at(-1)?.value;
    mounted.unmount();
    expect(clearInterval).toHaveBeenCalledWith(firstTimer);
    const resumed = renderHook(() => {
        const now = useHealthStatusNow();
        return {now, short: getEffectiveHealth(short, now), long: getEffectiveHealth(long, now)};
    });
    expect(resumed.result.current.short.Overall).toBe(EFlag.Grey);
    act(() => {
        jest.setSystemTime(12000);
        document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(resumed.result.current.long.Overall).toBe(EFlag.Grey);
    expect(resumed.result.current.now).toBe(12000);
    act(() => {
        jest.setSystemTime(14000);
        window.dispatchEvent(new Event('pageshow'));
    });
    expect(resumed.result.current.now).toBe(14000);
    const resumedTimer = interval.mock.results.at(-1)?.value;
    resumed.unmount();
    expect(clearInterval).toHaveBeenCalledWith(resumedTimer);
    interval.mockRestore();
    clearInterval.mockRestore();
    expect(
        getHealthStatusError({healthExpiresAt: 1000, error: '400 Bad Request'}, 14000),
    ).toContain('400');
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
