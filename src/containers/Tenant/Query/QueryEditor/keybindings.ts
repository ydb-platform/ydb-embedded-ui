import type Monaco from 'monaco-editor';

export function getKeyBindings(monaco: typeof Monaco) {
    const {KeyMod, KeyCode} = monaco;

    const ctrlKey = KeyMod.CtrlCmd;
    const altKey = KeyMod.Alt;

    /* eslint-disable no-bitwise */
    return {
        sendQuery: ctrlKey | KeyCode.Enter,
        sendSelectedQuery: ctrlKey | KeyMod.Shift | monaco.KeyCode.Enter,
        saveQuery: ctrlKey | KeyCode.KeyS,
        saveQueryAs: ctrlKey | KeyMod.Shift | KeyCode.KeyS,
        shortcutsHotkey: ctrlKey | KeyCode.KeyK,
        newTab: ctrlKey | altKey | KeyCode.KeyT,
        renameTab: ctrlKey | KeyCode.KeyT,
        closeTab: ctrlKey | KeyCode.Backspace,
        closeOtherTabs: ctrlKey | KeyMod.Shift | KeyCode.Backspace,
        closeAllTabs: ctrlKey | altKey | KeyCode.Backspace,
        nextTab: ctrlKey | altKey | KeyCode.RightArrow,
        previousTab: ctrlKey | altKey | KeyCode.LeftArrow,
    };
}
