import React from 'react';

import {uiFactory} from '../../uiFactory/uiFactory';

import {useTypedSelector} from './useTypedSelector';

export function useDatacenterColorIndexes() {
    const indexes = useTypedSelector((state) => state.datacenters.indexes);
    const configuredIndexes = uiFactory.datacenterColorIndexes;
    return React.useMemo(() => ({...indexes, ...configuredIndexes}), [indexes, configuredIndexes]);
}
