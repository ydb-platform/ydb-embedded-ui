jest.mock('../../../store', () => ({
    backend: '/backend/node/8',
    clusterName: undefined,
    environment: undefined,
}));

import type {AxiosAdapter, InternalAxiosRequestConfig} from 'axios';

import {TabletsAPI} from '../tablets';

function createApi() {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
        requests.push(config);
        return {data: {Id: '101'}, status: 200, statusText: 'OK', headers: {}, config};
    };
    const api = new TabletsAPI(
        {config: {adapter}},
        {
            singleClusterMode: true,
            proxyMeta: false,
            useRelativePath: false,
            csrfTokenGetter: () => 'synthetic-csrf',
        },
    );
    return {api, requests};
}

describe.each([
    {name: 'legacy caller', useSecurePath: undefined, page: 'app'},
    {name: 'flag disabled', useSecurePath: false, page: 'app'},
    {name: 'flag enabled', useSecurePath: true, page: 'app/secure'},
])('Tablet DevUI: $name', ({useSecurePath, page}) => {
    test.each(['stopTablet', 'resumeTablet'] as const)(
        '%s keeps the Hive target, payload and retry/CSRF options',
        async (method) => {
            const {api, requests} = createApi();
            await api[method]('101', '55', useSecurePath);

            const action = method === 'stopTablet' ? 'StopTablet' : 'ResumeTablet';
            expect(requests).toHaveLength(1);
            expect(requests[0].url).toBe(
                `/backend/node/8/tablets/${page}?TabletID=55&page=${action}&tablet=101`,
            );
            expect(requests[0].method).toBe('post');
            expect(JSON.parse(requests[0].data)).toEqual({});
            expect(requests[0]['axios-retry']).toEqual(expect.objectContaining({retries: 0}));
            expect(requests[0].headers.get('X-CSRF-Token')).toBe('synthetic-csrf');
        },
    );

    test('Hive info keeps the query, signal and concurrentId', async () => {
        const {api, requests} = createApi();
        const signal = new AbortController().signal;
        const get = jest.spyOn(api, 'get');
        const response = await api.getTabletFromHive(
            {id: '101', hiveId: '55', useSecurePath},
            {signal, concurrentId: 'tablet-info'},
        );

        expect(response).toEqual({Id: '101'});
        expect(requests[0].url).toBe(`/backend/node/8/tablets/${page}`);
        expect(requests[0].params).toEqual({TabletID: '55', page: 'TabletInfo', tablet: '101'});
        expect(requests[0].signal).toBe(signal);
        expect(get).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
                concurrentId: 'tablet-info',
                requestConfig: expect.objectContaining({signal}),
            }),
        );
    });

    test('legacy evict keeps the BSC command and exact Accept header', async () => {
        const {api, requests} = createApi();
        await api.evictVDiskOld({
            groupId: 1,
            groupGeneration: 2,
            failRealmIdx: 3,
            failDomainIdx: 4,
            vDiskIdx: 5,
            useSecurePath,
        });

        expect(requests[0].url).toBe(
            `/backend/node/8/tablets/${page}?TabletID=72057594037932033&exec=1`,
        );
        expect(JSON.parse(requests[0].data)).toEqual({
            Command: {
                ReassignGroupDisk: {
                    GroupId: 1,
                    GroupGeneration: 2,
                    FailRealmIdx: 3,
                    FailDomainIdx: 4,
                    VDiskIdx: 5,
                },
            },
        });
        expect(requests[0].headers.get('Accept')).toBe('application/json');
        expect(requests[0].headers.get('X-CSRF-Token')).toBe('synthetic-csrf');
    });
});

test('killTablet keeps its separate endpoint and disables retries', async () => {
    const {api, requests} = createApi();
    await api.killTablet('101');
    expect(requests[0].url).toBe('/backend/node/8/tablets?KillTabletID=101');
    expect(requests[0]['axios-retry']).toEqual(expect.objectContaining({retries: 0}));
});
