import {useFeatureFlagsAvailable} from '../../store/reducers/capabilities/hooks';
import {configsApi} from '../../store/reducers/configs';
import {isTopicsSqlIoOperationsEnabled} from '../topicsSqlIoOperations';

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
                    topicsSqlIoOperationsEnabled: isTopicsSqlIoOperationsEnabled(currentData),
                    isFetching,
                }),
            },
        );

    return {
        topicsSqlIoOperationsEnabled,
        isFeatureFlagsLoading,
    };
}
