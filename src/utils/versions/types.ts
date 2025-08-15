export type VersionsMap = Map<string, Set<string>>;
export type VersionToColorMap = Map<string, string>;

export type ColorIndexToVersionsMap = Map<number | string, Set<string>>;

interface VersionWithColorIndexes {
    color?: string;
    majorIndex?: number;
    minorIndex?: number;
}

export type VersionsDataMap = Map<string, VersionWithColorIndexes>;

export interface PreparedVersion extends VersionWithColorIndexes {
    version: string;
    minorVersion?: string;
    count?: number;
}

export type PreparedVersions = Record<string, PreparedVersion>;
