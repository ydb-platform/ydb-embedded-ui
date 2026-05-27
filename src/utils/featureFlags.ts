import type {FeatureFlagConfig} from '../types/api/featureFlags';

export function isFeatureFlagEnabled(featureFlags: FeatureFlagConfig[] | undefined, name: string) {
    const featureFlag = featureFlags?.find((flag) => flag.Name === name);

    return Boolean(featureFlag && (featureFlag.Current ?? featureFlag.Default));
}
