import AxiosWrapper from '@gravity-ui/axios-wrapper';
import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';
import type {AxiosRequestConfig} from 'axios';
import axiosRetry from 'axios-retry';

import {backend as BACKEND, metaBackend as META_BACKEND} from '../store';
import type {TMetaInfo} from '../types/api/acl';
import type {TQueryAutocomplete} from '../types/api/autocomplete';
import type {CapabilitiesResponse} from '../types/api/capabilities';
import type {TClusterInfo} from '../types/api/cluster';
import type {DescribeConsumerResult} from '../types/api/consumer';
import type {FeatureFlagConfigs} from '../types/api/featureFlags';
import type {HealthCheckAPIResponse} from '../types/api/healthcheck';
import type {JsonHotKeysResponse} from '../types/api/hotkeys';
import type {
    MetaBaseClusterInfo,
    MetaBaseClusters,
    MetaCluster,
    MetaClusters,
    MetaTenants,
} from '../types/api/meta';
import type {ModifyDiskResponse} from '../types/api/modifyDisk';
import type {TNetInfo} from '../types/api/netInfo';
import type {NodesRequestParams, TNodesInfo} from '../types/api/nodes';
import type {TEvNodesInfo} from '../types/api/nodesList';
import type {EDecommitStatus, TEvPDiskStateResponse, TPDiskInfoResponse} from '../types/api/pdisk';
import type {
    Actions,
    ErrorResponse,
    QueryAPIResponse,
    Stats,
    Timeout,
    TracingLevel,
} from '../types/api/query';
import type {JsonRenderRequestParams, JsonRenderResponse} from '../types/api/render';
import type {TEvDescribeSchemeResult} from '../types/api/schema';
import type {
    GroupsRequestParams,
    StorageGroupsResponse,
    StorageRequestParams,
    TStorageInfo,
} from '../types/api/storage';
import type {TEvSystemStateResponse} from '../types/api/systemState';
import type {
    TDomainKey,
    TEvTabletStateResponse,
    TTabletHiveResponse,
    UnmergedTEvTabletStateResponse,
} from '../types/api/tablet';
import type {TTenantInfo, TTenants} from '../types/api/tenant';
import type {DescribeTopicResult} from '../types/api/topic';
import type {TEvVDiskStateResponse} from '../types/api/vdisk';
import type {TUserToken} from '../types/api/whoami';
import type {QuerySyntax, TransactionMode} from '../types/store/query';
import {
    BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    DEV_ENABLE_TRACING_FOR_ALL_REQUESTS,
    SECOND_IN_MS,
} from '../utils/constants';
import {createPDiskDeveloperUILink} from '../utils/developerUI/developerUI';
import {isAxiosError} from '../utils/response';
import type {Nullable} from '../utils/typecheckers';

import {parseMetaCluster} from './parsers/parseMetaCluster';
import {parseMetaTenants} from './parsers/parseMetaTenants';
import {settingsManager} from './settings';

const TRACE_CHECK_TIMEOUT = 2 * SECOND_IN_MS;
const TRACE_API_ERROR_TIMEOUT = 10 * SECOND_IN_MS;
const MAX_TRACE_CHECK_RETRIES = 30;

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

        // Make possible manually enable tracing for all requests
        // For development purposes
        this._axios.interceptors.request.use(function (config) {
            const enableTracing = settingsManager.readUserSettingsValue(
                DEV_ENABLE_TRACING_FOR_ALL_REQUESTS,
            );

            if (enableTracing) {
                config.headers['X-Want-Trace'] = 1;
            }

            return config;
        });

        // Add traceId to response if it exists
        this._axios.interceptors.response.use(function (response) {
            if (
                response.data &&
                response.data instanceof Object &&
                !Array.isArray(response.data) &&
                response.headers['traceresponse']
            ) {
                const traceId = response.headers['traceresponse'].split('-')[1];

                response.data = {
                    ...response.data,
                    _meta: {...response.data._meta, traceId},
                };
            }

            return response;
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
    prepareArrayRequestParam(arr: (string | number)[]) {
        return arr.join(',');
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
    getClusterConfig(database?: string, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<FeatureFlagConfigs>(
            this.getPath('/viewer/feature_flags'),
            {
                database,
            },
            {concurrentId, requestConfig: {signal}},
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
            type = 'any',
            tablets = false,
            database,
            tenant,
            fieldsRequired = 'all',
            filter,
            ...params
        }: NodesRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const preparedFieldsRequired = Array.isArray(fieldsRequired)
            ? this.prepareArrayRequestParam(fieldsRequired)
            : fieldsRequired;

        return this.get<TNodesInfo>(
            this.getPath('/viewer/json/nodes?enums=true'),
            {
                type,
                tablets,
                // Do not send empty string
                filter: filter || undefined,
                // TODO: remove after remove tenant param
                database: database || tenant,
                tenant: tenant || database,
                fields_required: preparedFieldsRequired,
                ...params,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getStorageInfo(
        {tenant, database, nodeId, groupId, pDiskId, filter, ...params}: StorageRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TStorageInfo>(
            this.getPath(`/viewer/json/storage?enums=true`),
            {
                database: database || tenant,
                tenant: tenant || database,
                node_id: nodeId,
                group_id: groupId,
                pdisk_id: pDiskId,
                // Do not send empty string
                filter: filter || undefined,
                ...params,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getStorageGroups(
        {nodeId, pDiskId, groupId, fieldsRequired = 'all', filter, ...params}: GroupsRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        const preparedNodeId = Array.isArray(nodeId)
            ? this.prepareArrayRequestParam(nodeId)
            : nodeId;

        const preparedPDiskId = Array.isArray(pDiskId)
            ? this.prepareArrayRequestParam(pDiskId)
            : pDiskId;

        const preparedGroupId = Array.isArray(groupId)
            ? this.prepareArrayRequestParam(groupId)
            : groupId;

        const preparedFieldsRequired = Array.isArray(fieldsRequired)
            ? this.prepareArrayRequestParam(fieldsRequired)
            : fieldsRequired;

        return this.get<StorageGroupsResponse>(
            this.getPath('/storage/groups'),
            {
                node_id: preparedNodeId,
                pdisk_id: preparedPDiskId,
                group_id: preparedGroupId,
                fields_required: preparedFieldsRequired,
                // Do not send empty string
                filter: filter || undefined,
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
        {nodeId, path, database}: {nodeId?: string | number; path?: string; database?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvTabletStateResponse>(
            this.getPath('/viewer/json/tabletinfo'),
            {
                database,
                node_id: nodeId,
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
                partition_config: false,
                partition_stats: false,
                partitioning_info: false,
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
    getTablet(
        {id, database, nodeId}: {id: string; database?: string; nodeId?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvTabletStateResponse>(
            this.getPath('/viewer/json/tabletinfo'),
            {
                enums: true,
                database,
                node_id: nodeId,
                filter: `(TabletId=${id})`,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }
    getTabletHistory(
        {id, database, nodeId}: {id: string; database?: string; nodeId?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<UnmergedTEvTabletStateResponse>(
            this.getPath('/viewer/json/tabletinfo'),
            {
                enums: true,
                merge: false,
                database,
                node_id: nodeId,
                filter: `(TabletId=${id})`,
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
    sendQuery<Action extends Actions>(
        params: {
            query?: string;
            database?: string;
            action?: Action;
            syntax?: QuerySyntax;
            stats?: Stats;
            tracingLevel?: TracingLevel;
            transaction_mode?: TransactionMode;
            timeout?: Timeout;
            query_id?: string;
            limit_rows?: number;
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

        // FIXME: base64 is passed both to params and body to work on versions before and after 24-3
        return this.post<QueryAPIResponse<Action> | ErrorResponse | null>(
            this.getPath('/viewer/json/query'),
            {...params, base64},
            {schema: 'multi', base64},
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

    checkTrace({url}: {url: string}, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get(
            url,
            {},
            {
                concurrentId: concurrentId || 'checkTrace',
                requestConfig: {
                    signal,
                    timeout: TRACE_CHECK_TIMEOUT,
                    'axios-retry': {
                        retries: MAX_TRACE_CHECK_RETRIES,
                        retryDelay: (_: number, error: unknown) => {
                            const isTracingError =
                                isAxiosError(error) &&
                                (error?.response?.status === 404 || error.code === 'ERR_NETWORK');

                            if (isTracingError) {
                                return TRACE_CHECK_TIMEOUT;
                            }

                            return TRACE_API_ERROR_TIMEOUT;
                        },
                        shouldResetTimeout: true,
                        retryCondition: () => true,
                    },
                },
            },
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
    evictVDiskOld({
        groupId,
        groupGeneration,
        failRealmIdx,
        failDomainIdx,
        vDiskIdx,
    }: {
        groupId: string | number;
        groupGeneration: string | number;
        failRealmIdx: string | number;
        failDomainIdx: string | number;
        vDiskIdx: string | number;
    }) {
        // BSC Id is constant for all ydb clusters
        const BSC_TABLET_ID = '72057594037932033';

        return this.post(
            this.getPath(`/tablets/app?TabletID=${BSC_TABLET_ID}&exec=1`),
            {
                Command: {
                    ReassignGroupDisk: {
                        GroupId: groupId,
                        GroupGeneration: groupGeneration,
                        FailRealmIdx: failRealmIdx,
                        FailDomainIdx: failDomainIdx,
                        VDiskIdx: vDiskIdx,
                    },
                },
            },
            {},
            {
                headers: {
                    // This handler requires exactly this string
                    // Automatic headers may not suit
                    Accept: 'application/json',
                },
            },
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
        return this.post<ModifyDiskResponse>(
            this.getPath('/vdisk/evict'),
            {},
            {
                group_id: groupId,
                group_generation_id: groupGeneration,
                fail_realm_idx: failRealmIdx,
                fail_domain_idx: failDomainIdx,
                vdisk_idx: vDiskIdx,

                force,
            },
            {
                requestConfig: {'axios-retry': {retries: 0}},
            },
        );
    }

    restartPDiskOld({nodeId, pDiskId}: {nodeId: number | string; pDiskId: number | string}) {
        const pDiskPath = createPDiskDeveloperUILink({
            nodeId,
            pDiskId,
            host: this.getPath(''),
        });

        return this.post<ModifyDiskResponse>(
            pDiskPath,
            'restartPDisk=',
            {},
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
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
            this.getPath('/pdisk/restart'),
            {},
            {
                node_id: nodeId,
                pdisk_id: pDiskId,
                force,
            },
            {
                requestConfig: {'axios-retry': {retries: 0}},
            },
        );
    }
    changePDiskStatus({
        nodeId,
        pDiskId,
        force,
        decommissionStatus,
    }: {
        nodeId: number | string;
        pDiskId: number | string;
        force?: boolean;
        decommissionStatus?: EDecommitStatus;
    }) {
        return this.post<ModifyDiskResponse>(
            this.getPath('/pdisk/status'),
            {
                decommit_status: decommissionStatus,
            },
            {
                node_id: nodeId,
                pdisk_id: pDiskId,
                force,
            },
            {
                requestConfig: {'axios-retry': {retries: 0}},
            },
        );
    }
    killTablet(id: string) {
        return this.get<string>(
            this.getPath(`/tablets?KillTabletID=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }
    stopTablet(id: string, hiveId: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=StopTablet&tablet=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }
    resumeTablet(id: string, hiveId: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=ResumeTablet&tablet=${id}`),
            {},
            {requestConfig: {'axios-retry': {retries: 0}}},
        );
    }
    getTabletFromHive(
        {id, hiveId}: {id: string; hiveId: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<Nullable<TTabletHiveResponse>>(
            this.getPath('/tablets/app'),
            {
                TabletID: hiveId,
                page: 'TabletInfo',
                tablet: id,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
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

    getClustersList(_?: never, __: {signal?: AbortSignal} = {}): Promise<MetaClusters> {
        throw new Error('Method is not implemented.');
    }

    getClusterBaseInfo(
        _clusterName: string,
        _opts: AxiosOptions = {},
    ): Promise<MetaBaseClusterInfo> {
        throw new Error('Method is not implemented.');
    }
}

export class YdbWebVersionAPI extends YdbEmbeddedAPI {
    getClustersList(_?: never, {signal}: {signal?: AbortSignal} = {}) {
        return this.get<MetaClusters>(`${META_BACKEND || ''}/meta/clusters`, null, {
            requestConfig: {signal},
        });
    }

    getClusterInfo(clusterName: string, {signal}: AxiosOptions = {}) {
        return this.get<MetaCluster>(
            `${META_BACKEND || ''}/meta/cluster`,
            {
                name: clusterName,
            },
            {concurrentId: `getCluster${clusterName}`, requestConfig: {signal}},
        ).then(parseMetaCluster);
    }

    getTenants(clusterName: string, {signal}: AxiosOptions = {}) {
        return this.get<MetaTenants>(
            `${META_BACKEND || ''}/meta/cp_databases`,
            {
                cluster_name: clusterName,
            },
            {requestConfig: {signal}},
        ).then(parseMetaTenants);
    }

    getClusterBaseInfo(
        clusterName: string,
        {concurrentId, signal}: AxiosOptions = {},
    ): Promise<MetaBaseClusterInfo> {
        return this.get<MetaBaseClusters>(
            `${META_BACKEND || ''}/meta/db_clusters`,
            {
                name: clusterName,
            },
            {concurrentId, requestConfig: {signal}},
        ).then((data) => data.clusters[0]);
    }
}

export function createApi({webVersion = false, withCredentials = false} = {}) {
    const config: AxiosRequestConfig = {withCredentials};
    const api = webVersion ? new YdbWebVersionAPI({config}) : new YdbEmbeddedAPI({config});
    return api;
}
