import React from 'react';

import {getPreparedStorageNodesColumns} from './columns';
import type {GetStorageNodesColumnsParams} from './types';

export const useGetStorageNodesColumns = (params: GetStorageNodesColumnsParams) => {
    return React.useMemo(() => {
        return getPreparedStorageNodesColumns(params);
    }, [params]);
};
