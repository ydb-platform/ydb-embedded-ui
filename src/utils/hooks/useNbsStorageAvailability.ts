import {useRouteMatch} from 'react-router-dom';

import routes from '../../routes';
import {backend, clusterName, environment} from '../../store';
import {
    useCapabilitiesLoaded,
    useNbsStorageApiAvailable,
} from '../../store/reducers/capabilities/hooks';
import {storageApi} from '../../store/reducers/storage/storage';

import {useIsUserAllowedToMakeChanges} from './useIsUserAllowedToMakeChanges';

export function useNbsStorageAvailability(enabled = true): boolean | undefined {
    const mayViewStorage = useIsUserAllowedToMakeChanges();
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const apiAvailable = useNbsStorageApiAvailable();
    const isEligible = enabled && mayViewStorage && apiAvailable;
    const {currentData, isError} = storageApi.useGetNbsStorageConfigurationQuery(
        {backend, clusterName, environment},
        {skip: !isEligible, refetchOnMountOrArgChange: 30, pollingInterval: 30_000},
    );

    if (!enabled || mayViewStorage === false || (capabilitiesLoaded && !apiAvailable)) {
        return false;
    }

    return isEligible && !isError ? (currentData?.Configured ?? undefined) : undefined;
}

export function useNbsStorageAvailableInClusterView() {
    return useNbsStorageAvailability(Boolean(useRouteMatch(routes.cluster)));
}
