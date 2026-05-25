import {isMacOS} from '../../../../utils/platform';

/**
 * Hotkey labels for display in Gravity UI Hotkey component.
 * Uses `mod` prefix which maps to Cmd on Mac / Ctrl on other platforms.
 */
const NEXT_TAB_HOTKEY = isMacOS() ? 'mod+alt+right' : 'ctrl+pagedown';
const PREVIOUS_TAB_HOTKEY = isMacOS() ? 'mod+alt+left' : 'ctrl+pageup';

export const HOTKEY_LABELS = {
    newTab: 'mod+alt+n',
    renameTab: 'mod+alt+r',
    duplicateTab: 'mod+alt+c',
    closeTab: 'mod+alt+w',
    closeOtherTabs: 'mod+alt+backspace',
    closeAllTabs: 'mod+shift+backspace',
    saveQueryAs: 'mod+shift+s',
    nextTab: NEXT_TAB_HOTKEY,
    previousTab: PREVIOUS_TAB_HOTKEY,
} as const;

/**
 * Converts a Gravity UI hotkey label (e.g. `mod+alt+n`) to
 * a `hotkeys-js` compatible string (e.g. `command+alt+n` on Mac, `ctrl+alt+n` on others).
 */
export function toHotkeysJsFormat(label: string): string {
    const platformMod = isMacOS() ? 'command' : 'ctrl';
    return label.replace(/\bmod\b/g, platformMod);
}
