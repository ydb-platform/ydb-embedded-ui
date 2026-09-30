jest.mock('../../../store', () => ({backend: '/backend/node/8', clusterName: undefined}));

import type {AxiosAdapter, InternalAxiosRequestConfig} from 'axios';

import {StorageAPI} from '../storage';

function createApi(data: unknown) {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
        requests.push(config);
        return {data, status: 200, statusText: 'OK', headers: {}, config};
    };
    return {
        requests,
        api: new StorageAPI(
            {config: {adapter}},
            {
                singleClusterMode: true,
                proxyMeta: false,
                useRelativePath: false,
                csrfTokenGetter: () => undefined,
            },
        ),
    };
}

test.each(['tablets', 'disks'] as const)(
    'NBS %s preserves backend prefix, page, sort and cancellation',
    async (view) => {
        const {api, requests} = createApi({Status: {Code: 'OK'}, TotalCount: 80});
        const signal = new AbortController().signal;
        const params = {
            offset: 20,
            limit: 10,
            sort_by: 'disk_usage',
            sort_desc: true,
            group_by: 'disk_usage' as const,
            filter_group: '40',
        };
        expect(await api.getNbsStorage(view, params, {signal})).toEqual({
            Status: {Code: 'OK'},
            TotalCount: 80,
        });
        expect(requests[0].url).toBe(`/backend/node/8/cms/api/json/ddisk/${view}`);
        expect(requests[0].params).toEqual(params);
        expect(requests[0].signal).toBe(signal);
    },
);

test('CMS errors in successful HTTP responses must not appear as empty tables', async () => {
    const {api} = createApi({Status: {Code: 'ERROR_TEMP', Reason: 'Cannot collect cluster state'}});
    await expect(api.getNbsStorage('tablets', {})).rejects.toThrow('Cannot collect cluster state');
});
