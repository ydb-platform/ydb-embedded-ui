export type SetSettingResponse = {ready?: boolean; status?: string} | undefined;

/**
 * Settings values are stored as strings. Complex values (objects/arrays) must be JSON-stringified on write
 * and parsed on read.
 */
export type SettingValue = string;

/**
 * Remote settings responses contain raw stored values (JSON strings) keyed by setting name.
 */
export type GetSettingResponse = Record<string, SettingValue | undefined>;
export interface GetSingleSettingParams {
    user?: string;
    name: string;
}
export interface SetSingleSettingParams {
    user?: string;
    name: string;
    value: SettingValue;
}
export interface GetSettingsParams {
    user?: string;
    name: string[];
}
