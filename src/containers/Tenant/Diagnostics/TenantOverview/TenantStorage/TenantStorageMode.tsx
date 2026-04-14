import {
    useCapabilitiesLoaded,
    useNewStorageViewEnabled,
    useStorageStatsAvailable,
} from '../../../../../store/reducers/capabilities/hooks';

import {TenantStorage} from './TenantStorage';
import {TenantStorageNew} from './TenantStorageNew';
import type {TenantStorageProps} from './types';

export function TenantStorageMode(props: TenantStorageProps) {
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const newStorageViewEnabled = useNewStorageViewEnabled();
    const storageStatsAvailable = useStorageStatsAvailable();

    const shouldUseLegacy =
        props.databaseType === 'Serverless' ||
        !newStorageViewEnabled ||
        !capabilitiesLoaded ||
        !storageStatsAvailable;

    if (shouldUseLegacy) {
        return <TenantStorage {...props} />;
    }

    return <TenantStorageNew {...props} />;
}
