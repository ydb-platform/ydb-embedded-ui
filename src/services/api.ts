import AxiosWrapper from '@gravity-ui/axios-wrapper';
import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';
import type {AxiosRequestConfig} from 'axios';
import axiosRetry from 'axios-retry';
import qs from 'qs';

import {backend as BACKEND, metaBackend as META_BACKEND} from '../store';
import type {ComputeApiRequestParams, NodesApiRequestParams} from '../store/reducers/nodes/types';
import type {StorageApiRequestParams} from '../store/reducers/storage/types';
import type {TMetaInfo} from '../types/api/acl';
import type {TQueryAutocomplete} from '../types/api/autocomplete';
import type {CapabilitiesResponse} from '../types/api/capabilities';
import type {TClusterInfo} from '../types/api/cluster';
import type {TComputeInfo} from '../types/api/compute';
import type {DescribeConsumerResult} from '../types/api/consumer';
import type {HealthCheckAPIResponse} from '../types/api/healthcheck';
import type {JsonHotKeysResponse} from '../types/api/hotkeys';
import type {MetaCluster, MetaClusters, MetaTenants} from '../types/api/meta';
import type {ModifyDiskResponse} from '../types/api/modifyDisk';
import type {TNetInfo} from '../types/api/netInfo';
import type {TNodesInfo} from '../types/api/nodes';
import type {TEvNodesInfo} from '../types/api/nodesList';
import type {TEvPDiskStateResponse, TPDiskInfoResponse} from '../types/api/pdisk';
import type {
    Actions,
    ErrorResponse,
    QueryAPIResponse,
    Schemas,
    Stats,
    Timeout,
    TracingLevel,
    TransactionMode,
} from '../types/api/query';
import type {JsonRenderRequestParams, JsonRenderResponse} from '../types/api/render';
import type {TEvDescribeSchemeResult} from '../types/api/schema';
import type {TStorageInfo} from '../types/api/storage';
import type {TEvSystemStateResponse} from '../types/api/systemState';
import type {
    TDomainKey,
    TEvTabletStateResponse,
    UnmergedTEvTabletStateResponse,
} from '../types/api/tablet';
import type {TTenantInfo, TTenants} from '../types/api/tenant';
import type {DescribeTopicResult} from '../types/api/topic';
import type {TEvVDiskStateResponse} from '../types/api/vdisk';
import type {TUserToken} from '../types/api/whoami';
import type {QuerySyntax} from '../types/store/query';
import {BINARY_DATA_IN_PLAIN_TEXT_DISPLAY} from '../utils/constants';
import {prepareSortValue} from '../utils/filters';
import type {Nullable} from '../utils/typecheckers';

import {parseMetaCluster} from './parsers/parseMetaCluster';
import {parseMetaTenants} from './parsers/parseMetaTenants';
import {settingsManager} from './settings';

export type AxiosOptions = {
    concurrentId?: string;
    signal?: AbortSignal;
    withRetries?: boolean;
};

export class YdbEmbeddedAPI extends AxiosWrapper {
    DEFAULT_RETRIES_COUNT = 3;

    constructor(options?: AxiosWrapperOptions) {
        super(options);

        axiosRetry(this._axios, {
            retries: this.DEFAULT_RETRIES_COUNT,
            retryDelay: axiosRetry.exponentialDelay,
        });

        // Interceptor to process OIDC auth
        this._axios.interceptors.response.use(null, function (error) {
            const response = error.response;

            // OIDC proxy returns 401 response with authUrl in it
            // authUrl - external auth service link, after successful auth additional cookies will be appended
            // that will allow access to clusters where OIDC proxy is a balancer
            if (response && response.status === 401 && response.data?.authUrl) {
                window.location.assign(response.data.authUrl);
            }

            return Promise.reject(error);
        });
    }

    getPath(path: string) {
        return `${BACKEND ?? ''}${path}`;
    }
    getClusterCapabilities() {
        return this.get<CapabilitiesResponse>(this.getPath('/viewer/capabilities'), {}, {});
    }
    getClusterInfo(clusterName?: string, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TClusterInfo>(
            this.getPath('/viewer/json/cluster'),
            {
                name: clusterName,
                tablets: true,
            },
            {concurrentId: concurrentId || `getClusterInfo`, requestConfig: {signal}},
        );
    }
    getClusterNodes({concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TEvSystemStateResponse>(
            this.getPath('/viewer/json/sysinfo'),
            {},
            {concurrentId: concurrentId || `getClusterNodes`, requestConfig: {signal}},
        );
    }
    getNodeInfo(id?: string | number, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TEvSystemStateResponse>(
            this.getPath('/viewer/json/sysinfo?enums=true'),
            {
                node_id: id,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getTenants(clusterName?: string, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TTenantInfo>(
            this.getPath('/viewer/json/tenantinfo'),
            {
                tablets: false,
                storage: true,
                cluster_name: clusterName,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getTenantInfo(
        {path, database = path}: {path: string; database?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TTenantInfo>(
            this.getPath('/viewer/json/tenantinfo'),
            {
                database,
                path,
                tablets: false,
                storage: true,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getNodes(
        {
            visibleEntities,
            type = 'any',
            tablets = false,
            sortOrder,
            sortValue,
            ...params
        }: NodesApiRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const sort = prepareSortValue(sortValue, sortOrder);

        return this.get<TNodesInfo>(
            this.getPath('/viewer/json/nodes?enums=true'),
            {with: visibleEntities, type, tablets, sort, database: params.tenant, ...params},
            {concurrentId, requestConfig: {signal}},
        );
    }
    /** @deprecated use getNodes instead */
    getCompute(
        {sortOrder, sortValue, ...params}: ComputeApiRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const sort = prepareSortValue(sortValue, sortOrder);

        return this.get<TComputeInfo>(
            this.getPath('/viewer/json/compute?enums=true'),
            {sort, ...params},
            {concurrentId, requestConfig: {signal}},
        );
    }
    getStorageInfo(
        {
            tenant,
            visibleEntities,
            nodeId,
            poolName,
            groupId,
            sortOrder,
            sortValue,
            ...params
        }: StorageApiRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const sort = prepareSortValue(sortValue, sortOrder);

        return this.get<TStorageInfo>(
            this.getPath(`/viewer/json/storage?enums=true`),
            {
                database: tenant,
                tenant,
                node_id: nodeId,
                pool: poolName,
                group_id: groupId,
                with: visibleEntities,
                sort,
                ...params,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getNodeWhiteboardPDiskInfo(
        {nodeId, pDiskId}: {nodeId: string | number; pDiskId: string | number},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvPDiskStateResponse>(
            this.getPath('/viewer/json/pdiskinfo?enums=true'),
            {
                filter: `(NodeId=${nodeId}${pDiskId ? `;PDiskId=${pDiskId}` : ''})`,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getPDiskInfo(
        {nodeId, pDiskId}: {nodeId: string | number; pDiskId: string | number},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TPDiskInfoResponse>(
            this.getPath('/pdisk/info'),
            {
                node_id: nodeId,
                pdisk_id: pDiskId,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getVDiskInfo(
        {
            vDiskSlotId,
            pDiskId,
            nodeId,
        }: {
            vDiskSlotId: string | number;
            pDiskId: string | number;
            nodeId: string | number;
        },
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvVDiskStateResponse>(
            this.getPath('/viewer/json/vdiskinfo?enums=true'),
            {
                node_id: nodeId,
                filter: `(PDiskId=${pDiskId};VDiskSlotId=${vDiskSlotId})`,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getGroupInfo(groupId: string | number, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TStorageInfo>(
            this.getPath('/viewer/json/storage?enums=true'),
            {
                group_id: groupId,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getTabletsInfo(
        {nodes = [], path, database}: {nodes?: string[]; path?: string; database?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const filter = nodes.length > 0 && `(NodeId=[${nodes.join(',')}])`;
        return this.get<TEvTabletStateResponse>(
            this.getPath('/viewer/json/tabletinfo'),
            {
                database,
                filter,
                path,
                enums: true,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getSchema(
        {path, database}: {path: string; database: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(
            this.getPath('/viewer/json/describe'),
            {
                database,
                path,
                enums: true,
                backup: false,
                private: true,
                partition_config: true,
                partition_stats: true,
                partitioning_info: true,
                subs: 1,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getDescribe(
        {path, database}: {path: string; database: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(
            this.getPath('/viewer/json/describe'),
            {
                database,
                path,
                enums: true,
                partition_stats: true,
                subs: 0,
            },
            {concurrentId: concurrentId || `getDescribe|${path}`, requestConfig: {signal}},
        );
    }
    getSchemaAcl(
        {path, database}: {path: string; database: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TMetaInfo>(
            this.getPath('/viewer/json/acl'),
            {
                database,
                path,
                merge_rules: true,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getHeatmapData(
        {path, database}: {path: string; database: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(
            this.getPath('/viewer/json/describe'),
            {
                database,
                path,
                enums: true,
                backup: false,
                children: false,
                partition_config: false,
                partition_stats: true,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getNetwork(
        {path, database}: {path: string; database: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TNetInfo>(
            this.getPath('/viewer/json/netinfo'),
            {
                enums: true,
                database,
                path,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getTopic(
        {path, database}: {path: string; database: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<DescribeTopicResult>(
            this.getPath('/viewer/json/describe_topic'),
            {
                enums: true,
                include_stats: true,
                database,
                path,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getConsumer(
        {path, consumer, database}: {path: string; consumer: string; database: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<DescribeConsumerResult>(
            this.getPath('/viewer/json/describe_consumer'),
            {
                enums: true,
                include_stats: true,
                database,
                path,
                consumer,
            },
            {concurrentId: concurrentId || 'getConsumer', requestConfig: {signal}},
        );
    }
    getTablet({id}: {id?: string}, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TEvTabletStateResponse>(
            this.getPath(`/viewer/json/tabletinfo?filter=(TabletId=${id})`),
            {
                enums: true,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }
    getTabletHistory({id}: {id?: string}, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<UnmergedTEvTabletStateResponse>(
            this.getPath(`/viewer/json/tabletinfo?filter=(TabletId=${id})`),
            {
                enums: true,
                merge: false,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }
    getNodesList({concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TEvNodesInfo>(
            this.getPath('/viewer/json/nodelist'),
            {
                enums: true,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }
    getTenantsList({concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TTenants>(
            this.getPath('/viewer/json/tenants'),
            {
                enums: true,
                state: 0,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }
    sendQuery<Action extends Actions, Schema extends Schemas = undefined>(
        params: {
            query?: string;
            database?: string;
            action?: Action;
            schema?: Schema;
            syntax?: QuerySyntax;
            stats?: Stats;
            tracingLevel?: TracingLevel;
            transaction_mode?: TransactionMode;
            timeout?: Timeout;
            query_id?: string;
        },
        {concurrentId, signal, withRetries}: AxiosOptions = {},
    ) {
        /**
         * Return strings using base64 encoding.
         * @link https://github.com/ydb-platform/ydb/pull/647
         */
        const base64 = !settingsManager.readUserSettingsValue(
            BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
            true,
        );
        // FIXME: after backend fix
        const {schema, ...rest} = params;

        return this.post<QueryAPIResponse<Action, Schema> | ErrorResponse>(
            this.getPath('/viewer/json/query'),
            {...rest, base64},
            {schema},
            {
                concurrentId,
                timeout: params.timeout,
                requestConfig: {
                    signal,
                    'axios-retry': {retries: withRetries ? this.DEFAULT_RETRIES_COUNT : 0},
                },
                headers: params.tracingLevel
                    ? {
                          'X-Trace-Verbosity': params.tracingLevel,
                      }
                    : undefined,
            },
        );
    }
    getHotKeys(
        {path, database, enableSampling}: {path: string; database: string; enableSampling: boolean},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<JsonHotKeysResponse>(
            this.getPath('/viewer/json/hotkeys'),
            {
                database,
                path,
                enable_sampling: enableSampling,
            },
            {concurrentId: concurrentId || 'getHotKeys', requestConfig: {signal}},
        );
    }
    getHealthcheckInfo(
        {database, maxLevel}: {database: string; maxLevel?: number},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<HealthCheckAPIResponse>(
            this.getPath('/viewer/json/healthcheck?merge_records=true'),
            {database, tenant: database, max_level: maxLevel},
            {concurrentId, requestConfig: {signal}},
        );
    }
    evictVDisk({
        groupId,
        groupGeneration,
        failRealmIdx,
        failDomainIdx,
        vDiskIdx,
        force,
    }: {
        groupId: string | number;
        groupGeneration: string | number;
        failRealmIdx: string | number;
        failDomainIdx: string | number;
        vDiskIdx: string | number;
        force?: boolean;
    }) {
        const params = {
            group_id: groupId,
            group_generation_id: groupGeneration,
            fail_realm_idx: failRealmIdx,
            fail_domain_idx: failDomainIdx,
            vdisk_idx: vDiskIdx,

            force,
        };

        const paramsString = qs.stringify(params);

        const path = this.getPath(`/vdisk/evict?${paramsString}`);

        return this.post<ModifyDiskResponse>(
            path,
            {},
            {},
            {
                requestConfig: {'axios-retry': {retries: 0}},
            },
        );
    }
    restartPDisk({
        nodeId,
        pDiskId,
        force,
    }: {
        nodeId: number | string;
        pDiskId: number | string;
        force?: boolean;
    }) {
        return this.post<ModifyDiskResponse>(
            this.getPath(`/pdisk/restart?node_id=${nodeId}&pdisk_id=${pDiskId}&force=${force}`),
            {},
            {},
            {
                requestConfig: {'axios-retry': {retries: 0}},
            },
        );
    }
    killTablet(id?: string) {
        return this.get<string>(
            this.getPath(`/tablets?KillTabletID=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }
    stopTablet(id?: string, hiveId?: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=StopTablet&tablet=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }
    resumeTablet(id?: string, hiveId?: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=ResumeTablet&tablet=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }
    getTabletDescribe(tenantId: TDomainKey, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(
            this.getPath('/viewer/json/describe'),
            {
                schemeshard_id: tenantId?.SchemeShard,
                path_id: tenantId?.PathId,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getChartData(
        {target, from, until, maxDataPoints, database}: JsonRenderRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const requestString = `${target}&from=${from}&until=${until}&maxDataPoints=${maxDataPoints}&format=json`;

        return this.post<JsonRenderResponse>(
            this.getPath(`/viewer/json/render?database=${database}`),
            requestString,
            {},
            {
                concurrentId,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                requestConfig: {signal},
            },
        );
    }
    authenticate(params: {user: string; password: string}) {
        return this.post(this.getPath('/login'), params, {});
    }
    logout() {
        return this.post(this.getPath('/logout'), {}, {});
    }
    whoami() {
        return this.get<TUserToken>(this.getPath('/viewer/json/whoami'), {});
    }
    autocomplete(params: {database: string; prefix?: string; limit?: number; table?: string[]}) {
        const {table, ...rest} = params;
        const tablesParam = table?.join(',');
        return this.get<TQueryAutocomplete>(
            this.getPath('/viewer/json/autocomplete'),
            {...rest, table: tablesParam},
            {concurrentId: 'sql-autocomplete'},
        );
    }

    // used if not single cluster mode
    getClustersList(_?: never, {signal}: {signal?: AbortSignal} = {}) {
        return this.get<MetaClusters>(`${META_BACKEND || ''}/meta/clusters`, null, {
            requestConfig: {signal},
        });
    }

    createSchemaDirectory(
        {database, path}: {database: string; path: string},
        {signal}: {signal?: AbortSignal} = {},
    ) {
        return this.post<{test: string}>(
            this.getPath('/scheme/directory'),
            {},
            {
                database,
                path,
            },
            {
                requestConfig: {signal},
            },
        );
    }
}

export class YdbWebVersionAPI extends YdbEmbeddedAPI {
    getClusterInfo(clusterName: string, {signal}: AxiosOptions = {}) {
        return this.get<MetaCluster>(
            `${META_BACKEND || ''}/meta/cluster`,
            {
                name: clusterName,
            },
            {concurrentId: `getCluster${clusterName}`, requestConfig: {signal}},
        ).then(parseMetaCluster);
    }

    getTenants(clusterName: string, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<MetaTenants>(
            `${META_BACKEND || ''}/meta/cp_databases`,
            {
                cluster_name: clusterName,
            },
            {concurrentId, requestConfig: {signal}},
        ).then(parseMetaTenants);
    }
}

export function createApi({webVersion = false, withCredentials = false} = {}) {
    const config: AxiosRequestConfig = {withCredentials};
    const api = webVersion ? new YdbWebVersionAPI({config}) : new YdbEmbeddedAPI({config});
    return api;
}
