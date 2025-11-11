import type {MetaCapabilitiesResponse} from '../../types/api/capabilities';
import type {
    MetaBaseClusterInfo,
    MetaBaseClusters,
    MetaClusters,
    MetaTenants,
} from '../../types/api/meta';
import type {TUserToken} from '../../types/api/whoami';
import {parseMetaTenants} from '../parsers/parseMetaTenants';

import type {AxiosOptions} from './base';
import {BaseMetaAPI} from './baseMeta';

export class MetaAPI extends BaseMetaAPI {
    metaAuthenticate(params: {user: string; password: string}) {
        return this.post(this.getPath('/meta/login'), params, {});
    }

    metaLogout() {
        return this.post(this.getPath('/meta/logout'), {}, {});
    }

    metaWhoami() {
        return this.post<TUserToken>(this.getPath('/meta/whoami'), {}, {});
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
        {clusterName, database}: {clusterName?: string; database?: string},
        {signal}: AxiosOptions = {},
    ) {
        return this.get<MetaTenants>(
            this.getPath('/meta/cp_databases', clusterName),
            {
                cluster_name: clusterName,
                database_name: database,
            },
            {requestConfig: {signal}},
        ).then(parseMetaTenants);
    }

    getTenantsV2(
        {database, clusterName}: {clusterName?: string; database?: string},
        {signal}: AxiosOptions = {},
    ) {
        return this.get<MetaTenants>(
            this.getPath('/meta/databases', clusterName),
            {
                cluster_name: clusterName,
                database,
            },
            {requestConfig: {signal}},
        ).then(parseMetaTenants);
    }

    getClusterBaseInfo(
        clusterName: string,
        {concurrentId, signal}: AxiosOptions = {},
    ): Promise<MetaBaseClusterInfo> {
        return this.get<MetaBaseClusters>(
            this.getPath('/meta/db_clusters', clusterName),
            {
                name: clusterName,
            },
            {concurrentId, requestConfig: {signal}},
        ).then((data) => data.clusters[0]);
    }
}
