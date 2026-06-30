import type {FeatureFlagConfig} from '../types/api/featureFlags';

import {isFeatureFlagEnabled} from './featureFlags';

export const TOPICS_SQL_IO_OPERATIONS_FEATURE_FLAG = 'EnableTopicsSqlIoOperations';

export function isTopicsSqlIoOperationsEnabled(featureFlags: FeatureFlagConfig[] | undefined) {
    return isFeatureFlagEnabled(featureFlags, TOPICS_SQL_IO_OPERATIONS_FEATURE_FLAG);
}
