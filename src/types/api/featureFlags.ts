export interface FeatureFlagConfig {
    Name: string;
    Current?: boolean;
    Default?: boolean;
}

interface ConfigDb {
    Name: string;
    FeatureFlags: FeatureFlagConfig[];
}

export interface FeatureFlagConfigs {
    Databases: ConfigDb[];
}
