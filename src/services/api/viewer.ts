import type {PlanToSvgQueryParams} from '../../store/reducers/planToSvg';
import type {
    AccessRightsUpdateRequest,
    AvailablePermissionsResponse,
    TMetaInfo,
} from '../../types/api/acl';
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
    SendQueryParams,
} from '../../types/api/query';
import type {JsonRenderRequestParams, JsonRenderResponse} from '../../types/api/render';
import type {DescribeReplicationResult} from '../../types/api/replication';
import type {TEvDescribeSchemeResult} from '../../types/api/schema';
import type {StorageRequestParams, TStorageInfo} from '../../types/api/storage';
import type {TEvSystemStateResponse} from '../../types/api/systemState';
import type {
    TDomainKey,
    TEvTabletStateResponse,
    UnmergedTEvTabletStateResponse,
} from '../../types/api/tablet';
import type {TTenantInfo, TTenants} from '../../types/api/tenant';
import type {DescribeTopicResult, TopicDataRequest, TopicDataResponse} from '../../types/api/topic';
import type {VDiskBlobIndexResponse} from '../../types/api/vdiskBlobIndex';
import type {TUserToken} from '../../types/api/whoami';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {BINARY_DATA_IN_PLAIN_TEXT_DISPLAY} from '../../utils/constants';
import type {Nullable} from '../../utils/typecheckers';
import {settingsManager} from '../settings';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

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

    /** id=. returns data about node that fullfills request */
    getNodeInfo(
        {nodeId, database}: {nodeId?: string | number; database?: string},
        {concurrentId, timeout, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvSystemStateResponse>(
            this.getPath('/viewer/json/sysinfo?enums=true'),
            {
                node_id: nodeId,
                database,
                fields_required: -1,
            },
            {concurrentId, requestConfig: {signal}, timeout},
        );
    }

    getTenants({clusterName}: {clusterName?: string}, {concurrentId, signal}: AxiosOptions = {}) {
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
            tablets,
            database,
            tenant,
            fieldsRequired,
            filter,
            path,
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
                // Use tablets for backward compatibility even if fieldsRequired is passed
                tablets: tablets ?? fieldsRequired?.includes('Tablets'),
                // Do not send empty string
                filter: filter || undefined,
                // TODO: remove after remove tenant param
                database: database || tenant,
                fields_required: preparedFieldsRequired,
                path: this.getSchemaPath({path, database}),
                ...params,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }

    getTabletsInfo(
        {nodeId, path, database, filter}: TabletsApiRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvTabletStateResponse>(
            this.getPath('/viewer/json/tabletinfo'),
            {
                database,
                node_id: nodeId,
                path: this.getSchemaPath({path, database}),
                enums: true,
                filter,
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
                path: this.getSchemaPath({path, database}),
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
                path: this.getSchemaPath({path, database}),
                enums: true,
                partition_stats: true,
                subs: 0,
            },
            {concurrentId: concurrentId || `getDescribe|${path}`, requestConfig: {signal}, timeout},
        );
    }

    getSchemaAcl(
        {path, database, dialect}: {path: string; database: string; dialect: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TMetaInfo>(
            this.getPath('/viewer/json/acl'),
            {
                database,
                path: this.getSchemaPath({path, database}),
                merge_rules: true,
                dialect,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    getAvailablePermissions(
        {path, database, dialect}: {path: string; database: string; dialect: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<AvailablePermissionsResponse>(
            this.getPath('/viewer/json/acl'),
            {
                database,
                path: this.getSchemaPath({path, database}),
                merge_rules: true,
                dialect,
                list_permissions: true,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }
    updateAccessRights(
        {
            path,
            database,
            rights,
            dialect,
        }: {path: string; database: string; rights: AccessRightsUpdateRequest; dialect: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.post<AccessRightsUpdateRequest>(
            this.getPath('/viewer/json/acl'),
            rights,
            {
                database,
                path: this.getSchemaPath({path, database}),
                merge_rules: true,
                dialect,
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
                path: this.getSchemaPath({path, database}),
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
                path: this.getSchemaPath({path, database}),
            },
            {concurrentId, requestConfig: {signal}},
        );
    }

    getReplication(
        {path, database}: {path: string; database: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<DescribeReplicationResult>(
            this.getPath('/viewer/json/describe_replication'),
            {
                enums: true,
                include_stats: true,
                database,
                path: this.getSchemaPath({path, database}),
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
                path: this.getSchemaPath({path, database}),
            },
            {concurrentId, requestConfig: {signal}},
        );
    }

    getTopicData(params: TopicDataRequest, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TopicDataResponse>(this.getPath('/viewer/json/topic_data'), params, {
            concurrentId,
            requestConfig: {signal},
        });
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
                path: this.getSchemaPath({path, database}),
                consumer,
            },
            {concurrentId: concurrentId || 'getConsumer', requestConfig: {signal}},
        );
    }

    getTablet(
        {id, database, followerId}: {id: string; database?: string; followerId?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvTabletStateResponse>(
            this.getPath('/viewer/json/tabletinfo'),
            {
                enums: true,
                database,
                filter: `(TabletId=${id};FollowerId=${followerId || 0})`,
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
                filter: `(TabletId=${id};State!=Dead)`,
            },
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }

    getNodesList({database}: {database?: string}, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get<TEvNodesInfo>(
            this.getPath('/viewer/json/nodelist'),
            {
                enums: true,
                database,
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
        params: SendQueryParams<Action>,
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
                path: this.getSchemaPath({path, database}),
                enable_sampling: enableSampling,
            },
            {concurrentId: concurrentId || 'getHotKeys', requestConfig: {signal}},
        );
    }

    getTabletDescribe(
        tenantId: TDomainKey,
        database?: string,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(
            this.getPath('/viewer/json/describe'),
            {
                schemeshard_id: tenantId?.SchemeShard,
                path_id: tenantId?.PathId,
                database,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }

    getStorageInfo(
        {database, nodeId, groupId, pDiskId, filter, ...params}: StorageRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TStorageInfo>(
            this.getPath(`/viewer/json/storage?enums=true`),
            {
                database,
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

    whoami({database}: {database?: string}) {
        return this.get<TUserToken>(this.getPath('/viewer/json/whoami'), {database});
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

    getVDiskBlobIndexStat(
        {
            vDiskSlotId,
            pDiskId,
            nodeId,
            database,
        }: {
            vDiskSlotId: string | number;
            pDiskId: string | number;
            nodeId: string | number;
            database?: string;
        },
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<VDiskBlobIndexResponse>(
            this.getPath('/vdisk/blobindexstat'),
            {
                node_id: nodeId,
                pdisk_id: pDiskId,
                vslot_id: vDiskSlotId,
                database,
            },
            {concurrentId, requestConfig: {signal}},
        );
    }

    getNodeWhiteboardPDiskInfo(
        {
            nodeId,
            pDiskId,
            database,
        }: {nodeId: string | number; pDiskId: string | number; database?: string},
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TEvPDiskStateResponse>(
            this.getPath('/viewer/json/pdiskinfo?enums=true'),
            {
                filter: `(NodeId=${nodeId}${pDiskId ? `;PDiskId=${pDiskId}` : ''})`,
                database,
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
            {database, max_level: maxLevel},
            {concurrentId, requestConfig: {signal}},
        );
    }
}
