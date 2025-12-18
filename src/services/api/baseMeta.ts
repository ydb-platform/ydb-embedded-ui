import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';

import {environment as ENVIRONMENT, metaBackend as META_BACKEND} from '../../store';

import type {BaseAPIParams} from './base';
import {BaseYdbAPI} from './base';

export class BaseMetaAPI extends BaseYdbAPI {
    proxyMeta: BaseAPIParams['proxyMeta'];

    constructor(axiosOptions: AxiosWrapperOptions, baseApiParams: BaseAPIParams) {
        super(axiosOptions, baseApiParams);

        this.proxyMeta = baseApiParams.proxyMeta;
    }
    getPath(path: string, clusterName?: string) {
        const metaBackendPrefix = META_BACKEND ?? '';
        if (this.proxyMeta && clusterName) {
            const envPrefix = ENVIRONMENT ? `/${ENVIRONMENT}` : '';
            return `${envPrefix}${metaBackendPrefix}/proxy/cluster/${clusterName}${path}`;
        }
        return `${metaBackendPrefix}${path}`;
    }
}
