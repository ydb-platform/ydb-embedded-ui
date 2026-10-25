import React from 'react';

import type {DatacenterColorIndexes} from '../../utils/datacenters';

export const DatacenterContext = React.createContext<DatacenterColorIndexes | undefined>(undefined);

export function useDatacenterColorIndexes() {
    return React.useContext(DatacenterContext);
}
