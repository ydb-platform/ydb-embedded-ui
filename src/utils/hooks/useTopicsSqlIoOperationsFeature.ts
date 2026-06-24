import {useFeatureFlagsAvailable} from '../../store/reducers/capabilities/hooks';
import {configsApi} from '../../store/reducers/configs';
import {isTopicsSqlIoOperationsEnabled} from '../topicsSqlIoOperations';

import {useDatabaseFromQuery} from './useDatabaseFromQuery';

interface UseTopicsSqlIoOperationsFeatureResult {
    topicsSqlIoOperationsEnabled: boolean;
    isFeatureFlagsLoading: boolean;
}

export function useTopicsSqlIoOperationsFeature(
    database?: string,
    enabled = true,
): UseTopicsSqlIoOperationsFeatureResult {
    const databaseFromQuery = useDatabaseFromQuery();
    const featureFlagsAvailable = useFeatureFlagsAvailable();
    const selectedDatabase = database ?? databaseFromQuery;

    const {topicsSqlIoOperationsEnabled, isFetching: isFeatureFlagsLoading} =
        configsApi.useGetFeatureFlagsQuery(
            {database: selectedDatabase},
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
