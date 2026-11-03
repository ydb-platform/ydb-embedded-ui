import {configureStore} from '@reduxjs/toolkit';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {api} from '../../../store/reducers/api';
import {capabilitiesApi} from '../../../store/reducers/capabilities/capabilities';
import {clustersApi} from '../../../store/reducers/clusters/clusters';
import {healthcheckApi} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {tenantApi} from '../../../store/reducers/tenant/tenant';
import {tenantsApi} from '../../../store/reducers/tenants/tenants';
import type {MetaCapabilitiesResponse} from '../../../types/api/capabilities';
import {EFlag} from '../../../types/api/enums';
import {getEffectiveHealth, getHealthStatusError, prepareHealthStatus} from '../healthStatus';

async function createTestStore(
    versions: Record<string, number> | null = {
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
    if (versions) {
        await store.dispatch(
            capabilitiesApi.util.upsertQueryData('getMetaCapabilities', {}, {
                Capabilities: versions,
            } as MetaCapabilitiesResponse),
        );
    }
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
    jest.setSystemTime(1000);
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

test('starts the remaining lifetime when the Meta cluster response arrives', async () => {
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
    expect(result.data?.[0].cluster?.healthExpiresAt).toBe(7000);
    expect(result.data?.[1].cluster?.healthExpiresAt).toBe(12000);
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

// A version from a different endpoint must not opt this response into the new contract.
describe.each([
    ['clusters', '/meta/clusters'],
    ['database list', '/meta/databases'],
    ['single database', '/meta/databases'],
    ['cluster health', '/meta/cluster_health'],
])('%s capability compatibility', (endpoint, capability) => {
    test.each([
        ['failed', undefined, false],
        [undefined, undefined, false],
        [1, undefined, false],
        [2, undefined, true],
        [3, undefined, true],
        [undefined, 1, false],
        [1, 1, false],
        [2, 1, true],
        [3, 1, true],
    ] as const)(
        'handles a response at version %s with TTL %s',
        async (version, ttl, requiresFreshness) => {
            const tenant = {Name: '/Root/db', Id: 'db', Overall: EFlag.Green, status_ttl_ms: ttl};
            window.api = {
                meta: {
                    getMetaCapabilities: jest.fn().mockRejectedValue(new Error('Not available')),
                    getClustersList: jest.fn().mockResolvedValue({
                        clusters: [
                            {name: 'cluster', cluster: {Overall: EFlag.Green, status_ttl_ms: ttl}},
                        ],
                    }),
                    getTenantsV2: jest.fn().mockResolvedValue({TenantInfo: [tenant]}),
                    getClusterHealth: jest.fn().mockResolvedValue({
                        self_check_result: 'GOOD',
                        issue_log: [],
                        status_ttl_ms: ttl,
                    }),
                },
            } as unknown as YdbEmbeddedAPI;
            const versions: Record<string, number> = {
                '/meta/clusters': 2,
                '/meta/databases': 2,
                '/meta/cluster_health': 2,
            };
            if (version === undefined || version === 'failed') {
                delete versions[capability];
            } else {
                versions[capability] = version;
            }
            const store = await createTestStore(version === 'failed' ? null : versions);
            try {
                if (version === 'failed') {
                    await store.dispatch(
                        capabilitiesApi.endpoints.getMetaCapabilities.initiate({}),
                    );
                }
                if (endpoint === 'cluster health') {
                    const {data} = await store.dispatch(
                        healthcheckApi.endpoints.getClusterHealthcheckInfo.initiate({
                            clusterName: 'cluster',
                        }),
                    );
                    expect(data?.self_check_result).toBe('GOOD');
                    expect(Boolean(getHealthStatusError(data, 2000))).toBe(requiresFreshness);
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
                    expect(getEffectiveHealth(data, 2000).Overall).toBe(
                        requiresFreshness ? EFlag.Grey : EFlag.Green,
                    );
                }
            } finally {
                store.dispatch(api.util.resetApiState());
            }
        },
    );
});

test('captures the capability before waiting for the Meta cluster response', async () => {
    const response = deferred<object>();
    window.api = {
        meta: {getClustersList: jest.fn().mockReturnValue(response.promise)},
    } as unknown as YdbEmbeddedAPI;
    const store = await createTestStore({'/meta/clusters': 1});
    const request = store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    await store.dispatch(
        capabilitiesApi.util.upsertQueryData('getMetaCapabilities', {}, {
            Capabilities: {'/meta/clusters': 2},
        } as MetaCapabilitiesResponse),
    );
    response.resolve({clusters: [{name: 'cluster', cluster: {Overall: EFlag.Green}}]});
    const {data} = await request;
    const cluster = data?.[0].cluster;
    if (!cluster) {
        throw new Error('Expected health response');
    }
    expect(getEffectiveHealth(cluster, 1000).Overall).toBe(EFlag.Green);
    store.dispatch(api.util.resetApiState());
});
