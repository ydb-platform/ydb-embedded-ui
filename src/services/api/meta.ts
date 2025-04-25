import {metaBackend as META_BACKEND} from '../../store';
import type {MetaCapabilitiesResponse} from '../../types/api/capabilities';
import type {
    MetaBaseClusterInfo,
    MetaBaseClusters,
    MetaClusters,
    MetaTenants,
} from '../../types/api/meta';
import {parseMetaTenants} from '../parsers/parseMetaTenants';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

export class MetaAPI extends BaseYdbAPI {
    getPath(path: string) {
        return `${META_BACKEND ?? ''}${path}`;
    }

    getMetaCapabilities() {
        return this.get<MetaCapabilitiesResponse>(
            this.getPath('/capabilities'),
            {},
            {timeout: 1000},
        );
    }

    getClustersList(_?: never, {signal}: {signal?: AbortSignal} = {}) {
        return this.get<MetaClusters>(this.getPath('/meta/clusters'), null, {
            requestConfig: {signal},
        });
    }

    getTenants(
        {clusterName, databaseName}: {clusterName?: string; databaseName?: string},
        {signal}: AxiosOptions = {},
    ) {
        return this.get<MetaTenants>(
            this.getPath('/meta/cp_databases'),
            {
                cluster_name: clusterName,
                database_name: databaseName,
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
