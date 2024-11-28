import type {PlanToSvgQueryParams} from '../../store/reducers/planToSvg';
import type {TMetaInfo} from '../../types/api/acl';
import type {TQueryAutocomplete} from '../../types/api/autocomplete';
import type {CapabilitiesResponse} from '../../types/api/capabilities';
import type {TClusterInfo} from '../../types/api/cluster';
import type {DescribeConsumerResult} from '../../types/api/consumer';
import type {FeatureFlagConfigs} from '../../types/api/featureFlags';
import type {HealthCheckAPIResponse} from '../../types/api/healthcheck';
import type {JsonHotKeysResponse} from '../../types/api/hotkeys';
import type {TNetInfo} from '../../types/api/netInfo';
import type {NodesRequestParams, TNodesInfo} from '../../types/api/nodes';
import type {TEvNodesInfo} from '../../types/api/nodesList';
import type {TEvPDiskStateResponse} from '../../types/api/pdisk';
import type {
    Actions,
    ErrorResponse,
    QueryAPIResponse,
    Stats,
    Timeout,
    TracingLevel,
} from '../../types/api/query';
import type {JsonRenderRequestParams, JsonRenderResponse} from '../../types/api/render';
import type {TEvDescribeSchemeResult} from '../../types/api/schema';
import type {StorageRequestParams, TStorageInfo} from '../../types/api/storage';
import type {TEvSystemStateResponse} from '../../types/api/systemState';
import type {
    TDomainKey,
    TEvTabletStateResponse,
    UnmergedTEvTabletStateResponse,
} from '../../types/api/tablet';
import type {TTenantInfo, TTenants} from '../../types/api/tenant';
import type {DescribeTopicResult} from '../../types/api/topic';
import type {TEvVDiskStateResponse} from '../../types/api/vdisk';
import type {TUserToken} from '../../types/api/whoami';
import type {QuerySyntax, TransactionMode} from '../../types/store/query';
import {BINARY_DATA_IN_PLAIN_TEXT_DISPLAY} from '../../utils/constants';
import type {Nullable} from '../../utils/typecheckers';
import {settingsManager} from '../settings';

import {BaseYdbAPI} from './base';
import type {AxiosOptions} from './base';

export class ViewerAPI extends BaseYdbAPI {
    getClusterCapabilities({database}: {database?: string}) {
        return this.get<CapabilitiesResponse>(this.getPath('/viewer/capabilities'), {database}, {});
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
                memory: true,
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
            fieldsRequired,
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
        {path, database, timeout}: {path: string; database: string; timeout?: number},
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
            {concurrentId: concurrentId || `getDescribe|${path}`, requestConfig: {signal}, timeout},
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
        {id, database}: {id: string; database?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvTabletStateResponse>(
            this.getPath('/viewer/json/tabletinfo'),
            {
                enums: true,
                database,
                filter: `(TabletId=${id})`,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }

    getTabletHistory(
        {id, database}: {id: string; database?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<UnmergedTEvTabletStateResponse>(
            this.getPath('/viewer/json/tabletinfo'),
            {
                enums: true,
                merge: false,
                database,
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
        const base64 = !settingsManager.readUserSettingsValue(
            BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
            true,
        );

        return this.post<QueryAPIResponse<Action> | ErrorResponse | null>(
            this.getPath('/viewer/json/query'),
            {...params, base64},
            {schema: 'multi', base64, timeout: params.timeout},
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

    getClusterConfig(database?: string, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<FeatureFlagConfigs>(
            this.getPath('/viewer/feature_flags'),
            {
                database,
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

    planToSvg({database, plan}: PlanToSvgQueryParams, {signal}: {signal?: AbortSignal} = {}) {
        return this.post<string>(
            this.getPath('/viewer/plan2svg'),
            plan,
            {database},
            {
                requestConfig: {
                    signal,
                    responseType: 'text',
                    headers: {
                        Accept: 'image/svg+xml',
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
}
