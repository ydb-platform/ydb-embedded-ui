import AxiosWrapper from '@yandex-cloud/axios-wrapper';

import {backend as BACKEND} from '../store';
import {StorageTypes} from '../store/reducers/storage';

const config = {withCredentials: !window.custom_backend};

const {settingsApi} = window.web_version ? window.systemSettings : {};

export class YdbEmbeddedAPI extends AxiosWrapper {
    getPath(path) {
        return `${BACKEND}${path}`;
    }
    getClusterInfo() {
        return this.get(this.getPath('/viewer/json/cluster'), {tablets: true});
    }
    getNodes(path) {
        return this.get(this.getPath('/viewer/json/compute?enums=true'), {path});
    }
    getNodeInfo(id) {
        return this.get(this.getPath('/viewer/json/sysinfo?enums=true'), {
            node_id: id,
        });
    }
    getTenants() {
        return this.get(this.getPath('/viewer/json/tenantinfo'), {
            tablets: 1,
            storage: 1,
            nodes: 1,
        });
    }
    getTenantInfo({path}) {
        return this.get(this.getPath('/viewer/json/tenantinfo'), {
            path,
            tablets: true,
            storage: true,
        });
    }
    getStorageInfo({tenant, filter, nodeId, type}) {
        return this.get(
            this.getPath(
                `/viewer/json/${type === StorageTypes.nodes ? 'nodes' : 'storage'}?enums=true`,
            ),
            {
                tenant,
                node_id: nodeId,
                with: filter,
            },
        );
    }
    getPdiskInfo(nodeId, pdiskId) {
        return this.get(this.getPath('/viewer/json/pdiskinfo?enums=true'), {
            filter: `(NodeId=${nodeId}${pdiskId ? `;PDiskId=${pdiskId}` : ''})`,
        });
    }
    getVdiskInfo({vdiskId, pdiskId, nodeId}) {
        return this.get(this.getPath('/viewer/json/vdiskinfo?enums=true'), {
            filter: `(VDiskId=${vdiskId ?? ''};PDiskId=${pdiskId ?? ''};NodeId=${nodeId ?? ''})`,
        });
    }
    getGroupInfo(groupId) {
        return this.get(this.getPath('/viewer/json/storage?enums=true'), {
            group_id: groupId,
        });
    }
    getHostInfo() {
        return this.get(this.getPath('/viewer/json/sysinfo?node_id=.&enums=true'));
    }
    getTabletsInfo({nodes = [], path}) {
        const filter = nodes.length > 0 && `(NodeId=[${nodes.join(',')}])`;
        return this.get(this.getPath('/viewer/json/tabletinfo'), {
            filter,
            path,
            enums: true,
        });
    }
    getSchema({path}) {
        return this.get(
            this.getPath('/viewer/json/describe'),
            {
                path,
                enums: true,
                backup: false,
                private: false,
                partition_config: false,
                partition_stats: false,
                partitioning_info: false,
            },
            {concurrentId: `getSchema|${path}`},
        );
    }
    getDescribe({path}) {
        return this.get(this.getPath('/viewer/json/describe'), {
            path,
            enums: true,
        });
    }
    getSchemaAcl({path}) {
        return this.get(
            this.getPath('/viewer/json/metainfo'),
            {
                path,
            },
            {concurrentId: `getSchemaAcl|${path}`},
        );
    }
    getHeatmapData({path}) {
        return this.get(this.getPath('/viewer/json/describe'), {
            path,
            enums: true,
            backup: false,
            private: false,
            children: false,
            partition_config: false,
            partition_stats: true,
        });
    }
    getNetwork(path) {
        return this.get(this.getPath('/viewer/json/netinfo'), {
            enums: true,
            path,
        });
    }
    getPoolInfo(poolName) {
        return this.get(this.getPath('/viewer/json/storage'), {
            pool: poolName,
            enums: true,
        });
    }
    getTablet({id}) {
        return this.get(this.getPath(`/viewer/json/tabletinfo?filter=(TabletId=${id})`), {
            enums: true,
        });
    }
    getTabletHistory({id}) {
        return this.get(this.getPath(`/viewer/json/tabletinfo?filter=(TabletId=${id})`), {
            enums: true,
            merge: false,
        });
    }
    getNodesList() {
        return this.get(this.getPath('/viewer/json/nodelist'), {enums: true});
    }
    getTenantsList() {
        return this.get(this.getPath('/viewer/json/tenants'), {
            enums: true,
            state: 0,
        });
    }
    sendQuery(query, database, action, stats) {
        return this.post(this.getPath('/viewer/json/query'), {
            query,
            database,
            action,
            stats,
        });
    }
    getExplainQuery(query, database) {
        return this.post(this.getPath('/viewer/json/query'), {
            query,
            database,
            action: 'explain',
        });
    }
    getExplainQueryAst(query, database) {
        return this.post(this.getPath('/viewer/json/query'), {
            query,
            database,
            action: 'explain-ast',
        });
    }
    getHotKeys(path, enableSampling) {
        return this.get(this.getPath('/viewer/json/hotkeys'), {
            path,
            enable_sampling: enableSampling,
        });
    }
    getHealthcheckInfo(database) {
        return this.get(this.getPath('/viewer/json/healthcheck'), {
            tenant: database,
        });
    }
    killTablet(id) {
        return this.get(this.getPath(`/tablets?KillTabletID=${id}`));
    }
    stopTablet(id, hiveId) {
        return this.get(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=StopTablet&tablet=${id}`),
        );
    }
    resumeTablet(id, hiveId) {
        return this.get(
            this.getPath(`/tablets/app?TabletID=${hiveId}&page=ResumeTablet&tablet=${id}`),
        );
    }
    getTabletDescribe(TenantId) {
        return this.get(this.getPath('/viewer/json/describe'), {
            schemeshard_id: TenantId.SchemeShard,
            path_id: TenantId.PathId,
        });
    }
    postSetting(name, value) {
        return this.request({
            method: 'PATCH',
            url: settingsApi,
            data: {[name]: value},
        });
    }
    authenticate(user, password) {
        return this.post(this.getPath('/login'), {
            user,
            password,
        });
    }
    logout() {
        return this.post(this.getPath('/logout'), {});
    }
    whoami() {
        return this.get(this.getPath('/viewer/json/whoami'));
    }
}

const api = new YdbEmbeddedAPI({config: config});
window.api = api;
