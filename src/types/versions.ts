export type VersionsMap = Map<string, Set<string>>;
export type VersionToColorMap = Map<string, string>;

export interface VersionValue {
    value: number;
    color: string | undefined;
    version: string;
    title: string;
}
