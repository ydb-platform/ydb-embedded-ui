// The EM user settings endpoint stores the serialized request body as one YDB value.
export const MAX_USER_SETTING_BYTES = 16 * 1024 * 1024;

export function serializeUserSettingBody(value: string) {
    return JSON.stringify(value);
}
