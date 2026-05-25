import type Monaco from 'monaco-editor';

import {isMacOS} from '../../../../../utils/platform';

export function getKeyBindings(monaco: typeof Monaco) {
    const {KeyMod, KeyCode} = monaco;

    const ctrlKey = KeyMod.CtrlCmd;
    const altKey = KeyMod.Alt;
    const shiftKey = KeyMod.Shift;
    /* eslint-disable no-bitwise */
    return {
        sendQuery: ctrlKey | KeyCode.Enter,
        sendSelectedQuery: ctrlKey | shiftKey | monaco.KeyCode.Enter,
        saveQuery: ctrlKey | KeyCode.KeyS,
        saveQueryAs: ctrlKey | shiftKey | KeyCode.KeyS,
        shortcutsHotkey: ctrlKey | KeyCode.KeyK,
        newTab: ctrlKey | altKey | KeyCode.KeyN,
        renameTab: ctrlKey | altKey | KeyCode.KeyR,
        duplicateTab: ctrlKey | altKey | KeyCode.KeyC,
        closeTab: ctrlKey | altKey | KeyCode.KeyW,
        closeOtherTabs: ctrlKey | altKey | KeyCode.Backspace,
        closeAllTabs: ctrlKey | shiftKey | KeyCode.Backspace,
        nextTab: isMacOS() ? ctrlKey | altKey | KeyCode.RightArrow : ctrlKey | KeyCode.PageDown,
        previousTab: isMacOS() ? ctrlKey | altKey | KeyCode.LeftArrow : ctrlKey | KeyCode.PageUp,
    };
}
