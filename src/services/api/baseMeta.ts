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
        if (this.proxyMeta && clusterName) {
            const envPrefix = ENVIRONMENT ? `/${ENVIRONMENT}` : '';
            return `${envPrefix}${META_BACKEND}/proxy/cluster/${clusterName}${path}`;
        }
        return `${META_BACKEND ?? ''}${path}`;
    }
}
