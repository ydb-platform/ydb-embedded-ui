export type SetSettingResponse = {ready?: boolean; status?: string} | undefined;

export type GetSettingResponse = Record<string, Setting>;
export interface Setting {
    /**
     * JSON string representation of the stored value.
     */
    value?: SettingValue;
}
/**
 * Settings values are stored as strings. Complex values (objects/arrays) must be JSON-stringified on write
 * and parsed on read.
 */
export type SettingValue = string;
export interface GetSingleSettingParams {
    user: string;
    name: string;
}
export interface SetSingleSettingParams {
    user: string;
    name: string;
    value: SettingValue;
}
export interface GetSettingsParams {
    user: string;
    name: string[];
}
