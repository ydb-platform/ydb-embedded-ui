// Node and auth proxies return {"code":"NEED_RESET"} as response when token is outdated
export function isNeedResetResponse(data: unknown): data is {code: 'NEED_RESET'} {
    return Boolean(
        data && typeof data === 'object' && 'code' in data && data.code === 'NEED_RESET',
    );
}

const NEED_RESET_RELOAD_STORAGE_KEY = 'lastNeedResetReload';
// Throttle NEED_RESET-triggered reloads to avoid potential infinite reload loops
const NEED_RESET_RELOAD_THROTTLE_MS = 10_000;

export function processNeedReset() {
    const now = Date.now();

    try {
        const lastReloadRaw = window.sessionStorage.getItem(NEED_RESET_RELOAD_STORAGE_KEY);
        const lastReload = lastReloadRaw ? Number(lastReloadRaw) : 0;

        if (!Number.isFinite(lastReload) || now - lastReload >= NEED_RESET_RELOAD_THROTTLE_MS) {
            window.sessionStorage.setItem(NEED_RESET_RELOAD_STORAGE_KEY, String(now));
            window.location.reload();
        }
    } catch {
        // If sessionStorage is unavailable, fall back to a single reload attempt
        window.location.reload();
    }
}
