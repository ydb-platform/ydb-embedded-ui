import {metaBackend as META_BACKEND} from '../../store';
import type {
    MetaBaseClusterInfo,
    MetaBaseClusters,
    MetaCluster,
    MetaClusters,
    MetaTenants,
} from '../../types/api/meta';
import {parseMetaCluster} from '../parsers/parseMetaCluster';
import {parseMetaTenants} from '../parsers/parseMetaTenants';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

export class MetaAPI extends BaseYdbAPI {
    getPath(path: string) {
        return `${META_BACKEND ?? ''}${path}`;
    }

    getClustersList(_?: never, {signal}: {signal?: AbortSignal} = {}) {
        return this.get<MetaClusters>(this.getPath('/meta/clusters'), null, {
            requestConfig: {signal},
        });
    }

    getClusterInfo(clusterName?: string, {signal}: AxiosOptions = {}) {
        return this.get<MetaCluster>(
            this.getPath('/meta/cluster'),
            {
                name: clusterName,
            },
            {concurrentId: `getCluster${clusterName}`, requestConfig: {signal}},
        ).then(parseMetaCluster);
    }

    getTenants(clusterName?: string, {signal}: AxiosOptions = {}) {
        return this.get<MetaTenants>(
            this.getPath('/meta/cp_databases'),
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
            this.getPath('/meta/db_clusters'),
            {
                name: clusterName,
            },
            {concurrentId, requestConfig: {signal}},
        ).then((data) => data.clusters[0]);
    }
}
