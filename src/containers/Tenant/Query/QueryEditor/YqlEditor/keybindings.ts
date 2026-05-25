import type Monaco from 'monaco-editor';

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
        newTab: ctrlKey | altKey | KeyCode.KeyT,
        renameTab: ctrlKey | altKey | KeyCode.KeyR,
        duplicateTab: ctrlKey | altKey | KeyCode.KeyC,
        closeTab: ctrlKey | shiftKey | KeyCode.KeyW,
        closeOtherTabs: ctrlKey | altKey | KeyCode.Backspace,
        closeAllTabs: ctrlKey | shiftKey | KeyCode.Backspace,
        nextTab: ctrlKey | altKey | KeyCode.RightArrow,
        previousTab: ctrlKey | altKey | KeyCode.LeftArrow,
    };
}
