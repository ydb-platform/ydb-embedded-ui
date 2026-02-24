import {isMacOS} from '../../../../utils/platform';

/**
 * Hotkey labels for display in Gravity UI Hotkey component.
 * Uses `mod` prefix which maps to Cmd on Mac / Ctrl on other platforms.
 */
export const HOTKEY_LABELS = {
    newTab: 'mod+alt+t',
    renameTab: 'mod+alt+r',
    duplicateTab: 'mod+alt+c',
    closeTab: 'mod+backspace',
    closeOtherTabs: 'mod+alt+backspace',
    closeAllTabs: 'mod+shift+backspace',
    saveQueryAs: 'mod+shift+s',
    nextTab: 'mod+alt+right',
    previousTab: 'mod+alt+left',
} as const;

/**
 * Converts a Gravity UI hotkey label (e.g. `mod+alt+t`) to
 * a `hotkeys-js` compatible string (e.g. `command+alt+t` on Mac, `ctrl+alt+t` on others).
 */
export function toHotkeysJsFormat(label: string): string {
    const platformMod = isMacOS() ? 'command' : 'ctrl';
    return label.replace(/\bmod\b/g, platformMod);
}
