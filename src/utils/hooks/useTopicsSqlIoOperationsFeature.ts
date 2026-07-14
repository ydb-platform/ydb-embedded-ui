import {useFeatureFlagsAvailable} from '../../store/reducers/capabilities/hooks';
import {configsApi} from '../../store/reducers/configs';
import {isFeatureFlagEnabled} from '../featureFlags';

const TOPICS_SQL_IO_OPERATIONS_FEATURE_FLAG = 'EnableTopicsSqlIoOperations';

interface UseTopicsSqlIoOperationsFeatureResult {
    topicsSqlIoOperationsEnabled: boolean;
    isFeatureFlagsLoading: boolean;
}

export function useTopicsSqlIoOperationsFeature(
    database: string,
    enabled = true,
): UseTopicsSqlIoOperationsFeatureResult {
    const featureFlagsAvailable = useFeatureFlagsAvailable();

    const {topicsSqlIoOperationsEnabled, isFetching: isFeatureFlagsLoading} =
        configsApi.useGetFeatureFlagsQuery(
            {database},
            {
                skip: !featureFlagsAvailable || !enabled,
                selectFromResult: ({currentData, isFetching}) => ({
                    topicsSqlIoOperationsEnabled: isFeatureFlagEnabled(
                        currentData,
                        TOPICS_SQL_IO_OPERATIONS_FEATURE_FLAG,
                    ),
                    isFetching,
                }),
            },
        );

    return {
        topicsSqlIoOperationsEnabled,
        isFeatureFlagsLoading,
    };
}
