export function isMacOS() {
    if (typeof navigator === 'undefined') {
        return false;
    }

    // navigator.userAgentData is not yet in TypeScript DOM types
    const nav = navigator as Navigator & {userAgentData?: {platform: string}};
    const platform = nav.userAgentData?.platform || navigator.platform;
    return platform.toUpperCase().includes('MAC');
}
