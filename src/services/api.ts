import AxiosWrapper from '@gravity-ui/axios-wrapper';
import type {AxiosRequestConfig} from 'axios';

import type {
    Actions,
    ExplainActions,
    ExplainResponse,
    QueryAPIResponse,
    Schemas,
} from '../types/api/query';
import type {
    TDomainKey,
    TEvTabletStateResponse,
    UnmergedTEvTabletStateResponse,
} from '../types/api/tablet';
import type {TMetaInfo} from '../types/api/acl';
import type {TClusterInfo} from '../types/api/cluster';
import type {TComputeInfo} from '../types/api/compute';
import type {DescribeConsumerResult} from '../types/api/consumer';
import type {HealthCheckAPIResponse} from '../types/api/healthcheck';
import type {TNetInfo} from '../types/api/netInfo';
import type {TNodesInfo} from '../types/api/nodes';
import type {TEvNodesInfo} from '../types/api/nodesList';
import type {TEvDescribeSchemeResult} from '../types/api/schema';
import type {TStorageInfo} from '../types/api/storage';
import type {TEvSystemStateResponse} from '../types/api/systemState';
import type {TTenantInfo, TTenants} from '../types/api/tenant';
import type {DescribeTopicResult} from '../types/api/topic';
import type {TEvPDiskStateResponse} from '../types/api/pdisk';
import type {TEvVDiskStateResponse} from '../types/api/vdisk';
import type {TUserToken} from '../types/api/whoami';
import type {JsonRenderRequestParams, JsonRenderResponse} from '../types/api/render';
import type {QuerySyntax} from '../types/store/query';
import type {ComputeApiRequestParams, NodesApiRequestParams} from '../store/reducers/nodes/types';
import type {StorageApiRequestParams} from '../store/reducers/storage/types';
import type {MetaCluster, MetaClusters, MetaTenants} from '../types/api/meta';
import type {JsonHotKeysResponse} from '../types/api/hotkeys';

import {backend as BACKEND, metaBackend as META_BACKEND} from '../store';
import {prepareSortValue} from '../utils/filters';
import {createPDiskDeveloperUILink} from '../utils/developerUI/developerUI';
import {BINARY_DATA_IN_PLAIN_TEXT_DISPLAY} from '../utils/constants';
import {parseMetaCluster} from './parsers/parseMetaCluster';
import {parseMetaTenants} from './parsers/parseMetaTenants';
import {settingsManager} from './settings';
import {Nullable} from '../utils/typecheckers';

type AxiosOptions = {
    concurrentId?: string;
};

export class YdbEmbeddedAPI extends AxiosWrapper {
    getPath(path: string) {
        return `${BACKEND ?? ''}${path}`;
    }
    getClusterInfo(clusterName?: string, {concurrentId}: AxiosOptions = {}) {
        return this.get<TClusterInfo>(
            this.getPath('/viewer/json/cluster'),
            {
                name: clusterName,
                tablets: true,
            },
            {concurrentId: concurrentId || `getClusterInfo`},
        );
    }
    getClusterNodes({concurrentId}: AxiosOptions = {}) {
        return this.get<TEvSystemStateResponse>(
            this.getPath('/viewer/json/sysinfo'),
            {},
            {concurrentId: concurrentId || `getClusterNodes`},
        );
    }
    getNodeInfo(id?: string | number) {
        return this.get<TEvSystemStateResponse>(this.getPath('/viewer/json/sysinfo?enums=true'), {
            node_id: id,
        });
    }
    getTenants(clusterName?: string) {
        return this.get<TTenantInfo>(this.getPath('/viewer/json/tenantinfo'), {
            tablets: 1,
            storage: 1,
            cluster_name: clusterName,
        });
    }
    getTenantInfo({path}: {path: string}, {concurrentId}: AxiosOptions = {}) {
        return this.get<TTenantInfo>(
            this.getPath('/viewer/json/tenantinfo'),
            {
                path,
                tablets: true,
                storage: true,
            },
            {concurrentId: concurrentId || `getTenantInfo|${path}`},
        );
    }
    getNodes(
        {
            visibleEntities,
            type = 'any',
            tablets = true,
            sortOrder,
            sortValue,
            ...params
        }: NodesApiRequestParams,
        {concurrentId}: AxiosOptions = {},
    ) {
        const sort = prepareSortValue(sortValue, sortOrder);

        return this.get<TNodesInfo>(
            this.getPath('/viewer/json/nodes?enums=true'),
            {with: visibleEntities, type, tablets, sort, ...params},
            {concurrentId},
        );
    }
    /** @deprecated use getNodes instead */
    getCompute(
        {sortOrder, sortValue, ...params}: ComputeApiRequestParams,
        {concurrentId}: AxiosOptions = {},
    ) {
        const sort = prepareSortValue(sortValue, sortOrder);

        return this.get<TComputeInfo>(
            this.getPath('/viewer/json/compute?enums=true'),
            {sort, ...params},
            {concurrentId},
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
        {concurrentId}: AxiosOptions = {},
    ) {
        const sort = prepareSortValue(sortValue, sortOrder);

        return this.get<TStorageInfo>(
            this.getPath(`/viewer/json/storage?enums=true`),
            {
                tenant,
                node_id: nodeId,
                pool: poolName,
                group_id: groupId,
                with: visibleEntities,
                sort,
                ...params,
            },
            {concurrentId},
        );
    }
    getPdiskInfo(nodeId: string | number, pdiskId: string | number) {
        return this.get<TEvPDiskStateResponse>(this.getPath('/viewer/json/pdiskinfo?enums=true'), {
            filter: `(NodeId=${nodeId}${pdiskId ? `;PDiskId=${pdiskId}` : ''})`,
        });
    }
    getVdiskInfo({
        vDiskSlotId,
        pDiskId,
        nodeId,
    }: {
        vDiskSlotId: string | number;
        pDiskId: string | number;
        nodeId: string | number;
    }) {
        return this.get<TEvVDiskStateResponse>(this.getPath('/viewer/json/vdiskinfo?enums=true'), {
            node_id: nodeId,
            filter: `(PDiskId=${pDiskId};VDiskSlotId=${vDiskSlotId})`,
        });
    }
    getGroupInfo(groupId: string | number) {
        return this.get<TStorageInfo>(this.getPath('/viewer/json/storage?enums=true'), {
            group_id: groupId,
        });
    }
    getHostInfo() {
        return this.get<TEvSystemStateResponse>(
            this.getPath('/viewer/json/sysinfo?node_id=.&enums=true'),
            {},
        );
    }
    getTabletsInfo({nodes = [], path}: {nodes?: string[]; path?: string}) {
        const filter = nodes.length > 0 && `(NodeId=[${nodes.join(',')}])`;
        return this.get<TEvTabletStateResponse>(this.getPath('/viewer/json/tabletinfo'), {
            filter,
            path,
            enums: true,
        });
    }
    getSchema({path}: {path: string}, {concurrentId}: AxiosOptions = {}) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(
            this.getPath('/viewer/json/describe'),
            {
                path,
                enums: true,
                backup: false,
                private: true,
                partition_config: true,
                partition_stats: true,
                partitioning_info: true,
                subs: 1,
            },
            {concurrentId: concurrentId || `getSchema|${path}`},
        );
    }
    getDescribe({path}: {path: string}, {concurrentId}: AxiosOptions = {}) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(
            this.getPath('/viewer/json/describe'),
            {
                path,
                enums: true,
                partition_stats: true,
                subs: 0,
            },
            {concurrentId: concurrentId || `getDescribe|${path}`},
        );
    }
    getSchemaAcl({path}: {path: string}) {
        return this.get<TMetaInfo>(
            this.getPath('/viewer/json/acl'),
            {
                path,
            },
            {concurrentId: `getSchemaAcl`},
        );
    }
    getHeatmapData({path}: {path: string}) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(this.getPath('/viewer/json/describe'), {
            path,
            enums: true,
            backup: false,
            children: false,
            partition_config: false,
            partition_stats: true,
        });
    }
    getNetwork(path: string) {
        return this.get<TNetInfo>(this.getPath('/viewer/json/netinfo'), {
            enums: true,
            path,
        });
    }
    getTopic({path}: {path?: string}, {concurrentId}: AxiosOptions = {}) {
        return this.get<DescribeTopicResult>(
            this.getPath('/viewer/json/describe_topic'),
            {
                enums: true,
                include_stats: true,
                path,
            },
            {concurrentId: concurrentId || 'getTopic'},
        );
    }
    getConsumer(
        {path, consumer}: {path: string; consumer: string},
        {concurrentId}: AxiosOptions = {},
    ) {
        return this.get<DescribeConsumerResult>(
            this.getPath('/viewer/json/describe_consumer'),
            {
                enums: true,
                include_stats: true,
                path,
                consumer,
            },
            {concurrentId: concurrentId || 'getConsumer'},
        );
    }
    getPoolInfo(poolName: string) {
        return this.get<TStorageInfo>(this.getPath('/viewer/json/storage'), {
            pool: poolName,
            enums: true,
        });
    }
    getTablet({id}: {id?: string}) {
        return this.get<TEvTabletStateResponse>(
            this.getPath(`/viewer/json/tabletinfo?filter=(TabletId=${id})`),
            {
                enums: true,
            },
        );
    }
    getTabletHistory({id}: {id?: string}) {
        return this.get<UnmergedTEvTabletStateResponse>(
            this.getPath(`/viewer/json/tabletinfo?filter=(TabletId=${id})`),
            {
                enums: true,
                merge: false,
            },
        );
    }
    getNodesList() {
        return this.get<TEvNodesInfo>(this.getPath('/viewer/json/nodelist'), {enums: true});
    }
    getTenantsList() {
        return this.get<TTenants>(this.getPath('/viewer/json/tenants'), {
            enums: true,
            state: 0,
        });
    }
    sendQuery<Action extends Actions, Schema extends Schemas = undefined>(
        {
            schema,
            ...params
        }: {
            query?: string;
            database?: string;
            action?: Action;
            stats?: string;
            schema?: Schema;
            syntax?: QuerySyntax;
        },
        {concurrentId}: AxiosOptions = {},
    ) {
        // Time difference to ensure that timeout from ui will be shown rather than backend error
        const uiTimeout = 9 * 60 * 1000;
        const backendTimeout = 10 * 60 * 1000;

        /**
         * Return strings using base64 encoding.
         * @link https://github.com/ydb-platform/ydb/pull/647
         */
        const base64 = !settingsManager.readUserSettingsValue(
            BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
            true,
        );

        return this.post<QueryAPIResponse<Action, Schema>>(
            this.getPath(
                `/viewer/json/query?timeout=${backendTimeout}&base64=${base64}${
                    schema ? `&schema=${schema}` : ''
                }`,
            ),
            params,
            {},
            {
                concurrentId,
                timeout: uiTimeout,
            },
        );
    }
    getExplainQuery<Action extends ExplainActions>(
        query: string,
        database: string,
        action: Action,
        syntax?: QuerySyntax,
    ) {
        return this.post<ExplainResponse<Action>>(
            this.getPath('/viewer/json/query'),
            {
                query,
                database,
                action: action || 'explain',
                syntax,
                timeout: 600000,
            },
            {},
        );
    }
    getExplainQueryAst(query: string, database: string) {
        return this.post<ExplainResponse<'explain-ast'>>(
            this.getPath('/viewer/json/query'),
            {
                query,
                database,
                action: 'explain-ast',
                timeout: 600000,
            },
            {},
        );
    }
    getHotKeys(path: string, enableSampling: boolean, {concurrentId}: AxiosOptions = {}) {
        return this.get<JsonHotKeysResponse>(
            this.getPath('/viewer/json/hotkeys'),
            {
                path,
                enable_sampling: enableSampling,
            },
            {concurrentId: concurrentId || 'getHotKeys'},
        );
    }
    getHealthcheckInfo(database: string, {concurrentId}: AxiosOptions = {}) {
        return this.get<HealthCheckAPIResponse>(
            this.getPath('/viewer/json/healthcheck?merge_records=true'),
            {tenant: database},
            {concurrentId},
        );
    }
    evictVDisk({
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
    restartPDisk(nodeId: number | string, pDiskId: number | string) {
        const pDiskPath = createPDiskDeveloperUILink({
            nodeId,
            pDiskId,
            host: this.getPath(''),
        });

        return this.post(
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
    killTablet(id?: string) {
        return this.get<string>(this.getPath(`/tablets?KillTabletID=${id}`), {});
    }
    stopTablet(id?: string, hiveId?: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=StopTablet&tablet=${id}`),
            {},
        );
    }
    resumeTablet(id?: string, hiveId?: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=ResumeTablet&tablet=${id}`),
            {},
        );
    }
    getTabletDescribe(tenantId: TDomainKey) {
        return this.get<Nullable<TEvDescribeSchemeResult>>(this.getPath('/viewer/json/describe'), {
            schemeshard_id: tenantId?.SchemeShard,
            path_id: tenantId?.PathId,
        });
    }
    getChartData(
        {target, from, until, maxDataPoints, database}: JsonRenderRequestParams,
        {concurrentId}: AxiosOptions = {},
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
            },
        );
    }
    /** @deprecated use localStorage instead */
    postSetting(settingsApi: string, name: string, value: string) {
        return this.request({
            method: 'PATCH',
            url: settingsApi,
            data: {[name]: value},
        });
    }
    authenticate(user: string, password: string) {
        return this.post(
            this.getPath('/login'),
            {
                user,
                password,
            },
            {},
        );
    }
    logout() {
        return this.post(this.getPath('/logout'), {}, {});
    }
    whoami() {
        return this.get<TUserToken>(this.getPath('/viewer/json/whoami'), {});
    }

    // used if not single cluster mode
    getClustersList() {
        return this.get<MetaClusters>(`${META_BACKEND || ''}/meta/clusters`, null);
    }
}

export class YdbWebVersionAPI extends YdbEmbeddedAPI {
    getClusterInfo(clusterName: string) {
        return this.get<MetaCluster>(
            `${META_BACKEND || ''}/meta/cluster`,
            {
                name: clusterName,
            },
            {concurrentId: `getCluster${clusterName}`},
        ).then(parseMetaCluster);
    }

    getTenants(clusterName: string) {
        return this.get<MetaTenants>(`${META_BACKEND || ''}/meta/cp_databases`, {
            cluster_name: clusterName,
        }).then(parseMetaTenants);
    }
}

export function createApi({webVersion = false, withCredentials = false} = {}) {
    const config: AxiosRequestConfig = {withCredentials};
    const api = webVersion ? new YdbWebVersionAPI({config}) : new YdbEmbeddedAPI({config});
    return api;
}
