export function isMacOS() {
    return typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
}
