import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';

import {metaBackend as META_BACKEND} from '../../store';
import type {MetaCapabilitiesResponse} from '../../types/api/capabilities';
import type {
    MetaBaseClusterInfo,
    MetaBaseClusters,
    MetaClusters,
    MetaTenants,
} from '../../types/api/meta';
import type {TUserToken} from '../../types/api/whoami';
import {parseMetaTenants} from '../parsers/parseMetaTenants';

import type {AxiosOptions, BaseAPIParams} from './base';
import {BaseYdbAPI} from './base';

export class MetaAPI extends BaseYdbAPI {
    proxyMeta: BaseAPIParams['proxyMeta'];

    constructor(axiosOptions: AxiosWrapperOptions, baseApiParams: BaseAPIParams) {
        super(axiosOptions, baseApiParams);

        this.proxyMeta = baseApiParams.proxyMeta;
    }
    getPath(path: string, clusterName?: string) {
        if (this.proxyMeta && clusterName) {
            return `${META_BACKEND}/proxy/cluster/${clusterName}${path}`;
        }
        return `${META_BACKEND ?? ''}${path}`;
    }

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
