import {configureStore} from '@reduxjs/toolkit';
import {act, renderHook} from '@testing-library/react';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {api} from '../../../store/reducers/api';
import {capabilitiesApi} from '../../../store/reducers/capabilities/capabilities';
import {clustersApi} from '../../../store/reducers/clusters/clusters';
import {healthcheckApi} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {tenantApi} from '../../../store/reducers/tenant/tenant';
import {tenantsApi} from '../../../store/reducers/tenants/tenants';
import type {MetaCapabilitiesResponse} from '../../../types/api/capabilities';
import {EFlag} from '../../../types/api/enums';
import * as healthClock from '../healthClock';
import {getEffectiveHealth, getHealthStatusError, prepareHealthStatus} from '../healthStatus';
import {useHealthStatusNow} from '../useHealthStatusNow';

async function createTestStore(
    versions: Record<string, number> = {
        '/meta/clusters': 2,
        '/meta/databases': 2,
        '/meta/cluster_health': 2,
    },
) {
    const store = configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({serializableCheck: false}).concat(api.middleware),
    });
    await store.dispatch(
        capabilitiesApi.util.upsertQueryData('getMetaCapabilities', {}, {
            Capabilities: versions,
        } as MetaCapabilitiesResponse),
    );
    return store;
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
    const data = prepareHealthStatus({status_ttl_ms: ttl as number, Overall: EFlag.Green}, 1000, 2);
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
    const store = await createTestStore();
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
        const store = await createTestStore();
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
    const store = await createTestStore();
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
    const store = await createTestStore();
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
    expect(getHealthStatusError({...data, healthStatusSource: 'meta'}, now, error)).toBe(expected);
});

test('a fresh Meta response recovers after a wall-clock rollback without reviving expired data', async () => {
    window.api = {
        meta: {
            getClustersList: jest.fn().mockResolvedValue({
                clusters: [{name: 'cluster', cluster: {Overall: EFlag.Green, status_ttl_ms: 1000}}],
            }),
        },
    } as unknown as YdbEmbeddedAPI;
    const store = await createTestStore();
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

// A version from a different endpoint must not opt this response into the new contract.
describe.each([
    ['clusters', '/meta/clusters'],
    ['database list', '/meta/databases'],
    ['single database', '/meta/databases'],
    ['cluster health', '/meta/cluster_health'],
])('%s capability compatibility', (endpoint, capability) => {
    test.each([
        [undefined, false],
        [1, false],
        [2, true],
        [3, true],
    ] as const)(
        'handles a response without TTL at version %s',
        async (version, requiresFreshness) => {
            const tenant = {Name: '/Root/db', Id: 'db', Overall: EFlag.Green};
            window.api = {
                meta: {
                    getClustersList: jest.fn().mockResolvedValue({
                        clusters: [{name: 'cluster', cluster: {Overall: EFlag.Green}}],
                    }),
                    getTenantsV2: jest.fn().mockResolvedValue({TenantInfo: [tenant]}),
                    getClusterHealth: jest
                        .fn()
                        .mockResolvedValue({self_check_result: 'GOOD', issue_log: []}),
                },
            } as unknown as YdbEmbeddedAPI;
            const versions: Record<string, number> = {
                '/meta/clusters': 2,
                '/meta/databases': 2,
                '/meta/cluster_health': 2,
            };
            if (version === undefined) {
                delete versions[capability];
            } else {
                versions[capability] = version;
            }
            const store = await createTestStore(versions);
            try {
                if (endpoint === 'cluster health') {
                    const {data} = await store.dispatch(
                        healthcheckApi.endpoints.getClusterHealthcheckInfo.initiate({
                            clusterName: 'cluster',
                        }),
                    );
                    expect(data?.self_check_result).toBe('GOOD');
                    expect(Boolean(getHealthStatusError(data, 1000))).toBe(requiresFreshness);
                } else {
                    const args = {clusterName: 'cluster', isMetaDatabasesAvailable: true};
                    const readHealth = async () => {
                        if (endpoint === 'clusters') {
                            return (
                                await store.dispatch(
                                    clustersApi.endpoints.getClustersList.initiate(undefined),
                                )
                            ).data?.[0].cluster;
                        }
                        if (endpoint === 'database list') {
                            return (
                                await store.dispatch(
                                    tenantsApi.endpoints.getTenantsInfo.initiate(args),
                                )
                            ).data?.[0];
                        }
                        return (
                            await store.dispatch(
                                tenantApi.endpoints.getTenantInfo.initiate({
                                    ...args,
                                    database: '/Root/db',
                                }),
                            )
                        ).data;
                    };
                    const data = await readHealth();
                    if (!data) {
                        throw new Error('Expected health response');
                    }
                    expect(getEffectiveHealth(data, 1000).Overall).toBe(
                        requiresFreshness ? EFlag.Grey : EFlag.Green,
                    );
                }
            } finally {
                store.dispatch(api.util.resetApiState());
            }
        },
    );
});

test('waits for an in-flight capabilities lookup before classifying a health response', async () => {
    const capabilities = deferred<MetaCapabilitiesResponse>();
    window.api = {
        meta: {
            getMetaCapabilities: jest.fn().mockReturnValue(capabilities.promise),
            getClustersList: jest.fn().mockResolvedValue({
                clusters: [{name: 'cluster', cluster: {Overall: EFlag.Green}}],
            }),
        },
    } as unknown as YdbEmbeddedAPI;
    const store = await createTestStore({});
    const lookup = store.dispatch(
        capabilitiesApi.endpoints.getMetaCapabilities.initiate({}, {forceRefetch: true}),
    );
    const request = store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    await jest.advanceTimersByTimeAsync(0);
    expect(
        clustersApi.endpoints.getClustersList.select(undefined)(store.getState()).isLoading,
    ).toBe(true);
    capabilities.resolve({Capabilities: {'/meta/clusters': 2}} as MetaCapabilitiesResponse);
    await lookup;
    const {data} = await request;
    const cluster = data?.[0].cluster;
    if (!cluster) {
        throw new Error('Expected health response');
    }
    expect(getEffectiveHealth(cluster, 1000).Overall).toBe(EFlag.Grey);
    store.dispatch(api.util.resetApiState());
});

test('an unexpected TTL does not enable freshness checks on a legacy endpoint', () => {
    const data = prepareHealthStatus({Overall: EFlag.Green, status_ttl_ms: 1}, 1000, 1);
    expect(getEffectiveHealth(data, 2000).Overall).toBe(EFlag.Green);
    expect(getHealthStatusError(data, 2000)).toBeUndefined();
});
