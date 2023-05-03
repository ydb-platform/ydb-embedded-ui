import AxiosWrapper from '@gravity-ui/axios-wrapper';

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
import type {INodesApiRequestParams} from '../types/store/nodes';

import {backend as BACKEND} from '../store';

const config = {withCredentials: !window.custom_backend};

const settingsApi = window.web_version ? window.systemSettings?.settingsApi : undefined;

type AxiosOptions = {
    concurrentId?: string;
};

export class YdbEmbeddedAPI extends AxiosWrapper {
    getPath(path: string) {
        return `${BACKEND}${path}`;
    }
    getClusterInfo(clusterName?: string) {
        return this.get<TClusterInfo>(this.getPath('/viewer/json/cluster'), {
            name: clusterName,
            tablets: true,
        });
    }
    getNodeInfo(id?: string) {
        return this.get<TEvSystemStateResponse>(this.getPath('/viewer/json/sysinfo?enums=true'), {
            node_id: id,
        });
    }
    getTenants() {
        return this.get<TTenantInfo>(this.getPath('/viewer/json/tenantinfo'), {
            tablets: 1,
            storage: 1,
        });
    }
    getTenantInfo({path}: {path: string}) {
        return this.get<TTenantInfo>(this.getPath('/viewer/json/tenantinfo'), {
            path,
            tablets: true,
            storage: true,
        });
    }
    getNodes(
        {tenant, filter, storage, type = 'any', tablets = true}: INodesApiRequestParams,
        {concurrentId}: AxiosOptions = {},
    ) {
        return this.get<TNodesInfo>(
            this.getPath('/viewer/json/nodes?enums=true'),
            {
                tenant,
                with: filter,
                storage,
                type,
                tablets,
            },
            {
                concurrentId,
            },
        );
    }
    getCompute(path: string) {
        return this.get<TComputeInfo>(this.getPath('/viewer/json/compute?enums=true'), {path});
    }
    getStorageInfo(
        {
            tenant,
            filter,
            nodeId,
        }: {
            tenant: string;
            filter: string;
            nodeId: string;
        },
        {concurrentId}: AxiosOptions = {},
    ) {
        return this.get<TStorageInfo>(
            this.getPath(`/viewer/json/storage?enums=true`),
            {
                tenant,
                node_id: nodeId,
                with: filter,
            },
            {
                concurrentId,
            },
        );
    }
    getPdiskInfo(nodeId: string | number, pdiskId: string | number) {
        return this.get<TEvPDiskStateResponse>(this.getPath('/viewer/json/pdiskinfo?enums=true'), {
            filter: `(NodeId=${nodeId}${pdiskId ? `;PDiskId=${pdiskId}` : ''})`,
        });
    }
    getVdiskInfo({
        vdiskId,
        pdiskId,
        nodeId,
    }: {
        vdiskId: string | number;
        pdiskId: string | number;
        nodeId: string | number;
    }) {
        return this.get<TEvVDiskStateResponse>(this.getPath('/viewer/json/vdiskinfo?enums=true'), {
            filter: `(VDiskId=${vdiskId ?? ''};PDiskId=${pdiskId ?? ''};NodeId=${nodeId ?? ''})`,
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
        return this.get<TEvDescribeSchemeResult>(
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
        return this.get<TEvDescribeSchemeResult>(
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
            {concurrentId: `getSchemaAcl|${path}`},
        );
    }
    getHeatmapData({path}: {path: string}) {
        return this.get<TEvDescribeSchemeResult>(this.getPath('/viewer/json/describe'), {
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
        {path, consumer}: {path?: string; consumer?: string},
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
            query,
            database,
            action,
            stats,
            schema,
        }: {
            query?: string;
            database?: string;
            action?: Action;
            stats?: string;
            schema?: Schema;
        },
        {concurrentId}: AxiosOptions = {},
    ) {
        return this.post<QueryAPIResponse<Action, Schema>>(
            this.getPath(`/viewer/json/query${schema ? `?schema=${schema}` : ''}`),
            {
                query,
                database,
                action,
                stats,
                timeout: 600000,
            },
            null,
            {
                concurrentId,
                timeout: 9 * 60 * 1000,
            },
        );
    }
    getExplainQuery<Action extends ExplainActions>(
        query: string,
        database: string,
        action: Action,
    ) {
        return this.post<ExplainResponse<Action>>(
            this.getPath('/viewer/json/query'),
            {
                query,
                database,
                action: action || 'explain',
                timeout: 600000,
            },
            null,
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
            null,
        );
    }
    getHotKeys(path: string, enableSampling: boolean) {
        return this.get(this.getPath('/viewer/json/hotkeys'), {
            path,
            enable_sampling: enableSampling,
        });
    }
    getHealthcheckInfo(database: string) {
        return this.get<HealthCheckAPIResponse>(this.getPath('/viewer/json/healthcheck'), {
            tenant: database,
        });
    }
    killTablet(id?: string) {
        return this.get<string>(this.getPath(`/tablets?KillTabletID=${id}`), null);
    }
    stopTablet(id?: string, hiveId?: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=StopTablet&tablet=${id}`),
            null,
        );
    }
    resumeTablet(id?: string, hiveId?: string) {
        return this.get<string>(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=ResumeTablet&tablet=${id}`),
            null,
        );
    }
    getTabletDescribe(tenantId: TDomainKey) {
        return this.get<TEvDescribeSchemeResult>(this.getPath('/viewer/json/describe'), {
            schemeshard_id: tenantId?.SchemeShard,
            path_id: tenantId?.PathId,
        });
    }
    postSetting(name: string, value: string) {
        return this.request({
            method: 'PATCH',
            url: settingsApi || '',
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
            null,
        );
    }
    logout() {
        return this.post(this.getPath('/logout'), null, null);
    }
    whoami() {
        return this.get<TUserToken>(this.getPath('/viewer/json/whoami'), null);
    }
}

const api = new YdbEmbeddedAPI({config: config});
window.api = api;
