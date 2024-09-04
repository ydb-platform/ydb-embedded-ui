export interface TConfigFeatureFlag {
    Name: string;
    Current?: boolean;
    Default?: boolean;
}

export interface TConfigDb {
    Name: string;
    FeatureFlags: TConfigFeatureFlag[];
}

export interface TConfigs {
    Databases: TConfigDb[];
}
