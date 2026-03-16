// Node and auth proxies returns {"code":"NEED_RESET"} as response when token is outdated
export function isNeedResetResponse(data: unknown): data is {code: 'NEED_RESET'} {
    return Boolean(data && data instanceof Object && 'code' in data && data.code === 'NEED_RESET');
}
