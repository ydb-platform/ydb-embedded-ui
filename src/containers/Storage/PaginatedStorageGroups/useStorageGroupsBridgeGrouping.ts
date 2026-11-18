import {
    useBridgeModeEnabled,
    useStorageGroupsHandlerHasBridgeSyncGrouping,
} from '../../../store/reducers/capabilities/hooks';

export function useStorageGroupsBridgeGrouping() {
    const bridgeModeEnabled = useBridgeModeEnabled();
    const handlerHasBridgeSyncGrouping = useStorageGroupsHandlerHasBridgeSyncGrouping();
    return {
        bridgeModeEnabled,
        bridgeSyncGroupingAvailable: bridgeModeEnabled && handlerHasBridgeSyncGrouping,
    };
}
