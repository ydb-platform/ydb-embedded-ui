import type {
    OperationCancelRequestParams,
    OperationForgetRequestParams,
    OperationListRequestParams,
    TOperationList,
} from '../../types/api/operations';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

export class OperationAPI extends BaseYdbAPI {
    getOperationList(
        params: OperationListRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.get<TOperationList>(
            this.getPath('/operation/list'),
            {...params},
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }

    cancelOperation(
        params: OperationCancelRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.post<TOperationList>(
            this.getPath('/operation/cancel'),
            {},
            {...params},
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }

    forgetOperation(
        params: OperationForgetRequestParams,
        {concurrentId, signal}: AxiosOptions = {},
    ) {
        return this.post<TOperationList>(
            this.getPath('/operation/forget'),
            {},
            {...params},
            {
                concurrentId,
                requestConfig: {signal},
            },
        );
    }
}
