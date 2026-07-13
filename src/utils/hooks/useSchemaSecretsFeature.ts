import {useFeatureFlagsAvailable} from '../../store/reducers/capabilities/hooks';
import {configsApi} from '../../store/reducers/configs';
import {isFeatureFlagEnabled} from '../featureFlags';

interface UseSchemaSecretsFeatureResult {
    schemaSecretsEnabled: boolean;
    isFeatureFlagsLoading: boolean;
}

const SCHEMA_SECRETS_FEATURE_FLAG = 'EnableSchemaSecrets';

export function useSchemaSecretsFeature(
    database: string,
    enabled = true,
): UseSchemaSecretsFeatureResult {
    const featureFlagsAvailable = useFeatureFlagsAvailable();

    const {schemaSecretsEnabled, isFetching: isFeatureFlagsLoading} =
        configsApi.useGetFeatureFlagsQuery(
            {database},
            {
                skip: !featureFlagsAvailable || !enabled,
                selectFromResult: ({currentData, isFetching}) => ({
                    schemaSecretsEnabled: isFeatureFlagEnabled(
                        currentData,
                        SCHEMA_SECRETS_FEATURE_FLAG,
                    ),
                    isFetching,
                }),
            },
        );

    return {
        schemaSecretsEnabled,
        isFeatureFlagsLoading,
    };
}
