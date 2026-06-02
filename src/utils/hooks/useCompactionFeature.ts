import {useFeatureFlagsAvailable} from '../../store/reducers/capabilities/hooks';
import {configsApi} from '../../store/reducers/configs';
import {isForcedCompactionEnabled} from '../tableCompaction';

interface UseCompactionFeatureResult {
    compactionEnabled: boolean;
    isFeatureFlagsLoading: boolean;
}

/**
 * Hook for checking if table compaction feature is enabled.
 * Fetches feature flags and determines if forced compaction is available.
 * @param database - Database path
 * @param enabled - Whether to fetch feature flags (default: true). Set to false to skip the query.
 * @returns Compaction feature availability and loading state
 */
export function useCompactionFeature(database: string, enabled = true): UseCompactionFeatureResult {
    const featureFlagsAvailable = useFeatureFlagsAvailable();

    const {currentData: featureFlags, isFetching: isFeatureFlagsLoading} =
        configsApi.useGetFeatureFlagsQuery({database}, {skip: !featureFlagsAvailable || !enabled});

    const compactionEnabled = isForcedCompactionEnabled(featureFlags);

    return {
        compactionEnabled,
        isFeatureFlagsLoading,
    };
}
