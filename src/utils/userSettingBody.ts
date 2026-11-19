// EM stores the serialized body of POST /meta/user_settings as one YDB value (Content).
// YDB's MaxWriteValueSize: https://github.com/ydb-platform/ydb/blob/main/ydb/core/tx/datashard/const.h#L16
// A browser's localStorage quota is separate from this limit.
export const MAX_USER_SETTING_BYTES = 16 * 1024 * 1024;

export function serializeUserSettingBody(value: string) {
    return JSON.stringify(value);
}
