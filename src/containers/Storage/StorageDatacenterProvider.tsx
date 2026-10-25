import type React from 'react';

import {DatacenterProvider} from '../../components/Datacenter/DatacenterProvider';

import {PDisksGroupBy, VDisksGroupBy} from './StorageExpertModePanel/constants';
import {
    useIsStorageExpertMode,
    usePDisksGroupByParam,
    useVDisksGroupByParam,
} from './useStorageQueryParams';

export function StorageDatacenterProvider({children}: {children: React.ReactNode}) {
    const isExpertMode = useIsStorageExpertMode();
    const pdisks = usePDisksGroupByParam();
    const vdisks = useVDisksGroupByParam();
    const enabled =
        isExpertMode &&
        (pdisks === PDisksGroupBy.Datacenter || vdisks === VDisksGroupBy.Datacenter);
    return <DatacenterProvider enabled={enabled}>{children}</DatacenterProvider>;
}
