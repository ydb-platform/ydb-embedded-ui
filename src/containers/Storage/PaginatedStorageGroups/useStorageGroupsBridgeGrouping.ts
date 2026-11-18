import {
    useBridgeModeEnabled,
    useStorageGroupsHandlerHasBridgeSyncStatus,
} from '../../../store/reducers/capabilities/hooks';

export function useStorageGroupsBridgeGrouping() {
    const bridgeModeEnabled = useBridgeModeEnabled();
    const handlerHasBridgeSyncStatus = useStorageGroupsHandlerHasBridgeSyncStatus();
    return {
        bridgeModeEnabled,
        bridgeSyncGroupingAvailable: bridgeModeEnabled && handlerHasBridgeSyncStatus,
    };
}
