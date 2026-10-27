import React from 'react';

import {getQueryScope, getQueryScopeKey} from '../../store/queryScope';
import {uiFactory} from '../../uiFactory/uiFactory';

import {useTypedSelector} from './useTypedSelector';

export function useDatacenterColorIndexes() {
    const indexes = useTypedSelector(
        (state) => state.datacenters.indexesByScope[getQueryScopeKey(getQueryScope())],
    );
    const configuredIndexes = uiFactory.datacenterColorIndexes;
    return React.useMemo(
        () => (indexes ? {...indexes, ...configuredIndexes} : configuredIndexes),
        [indexes, configuredIndexes],
    );
}
