import type Monaco from 'monaco-editor';

export function getKeyBindings(monaco: typeof Monaco) {
    const {KeyMod, KeyCode} = monaco;

    const ctrlKey = KeyMod.CtrlCmd;

    /* eslint-disable no-bitwise */
    return {
        sendQuery: ctrlKey | KeyCode.Enter,
        sendSelectedQuery: ctrlKey | KeyMod.Shift | monaco.KeyCode.Enter,
        saveQuery: ctrlKey | KeyCode.KeyS,
        saveSelectedQuery: ctrlKey | KeyMod.Shift | KeyCode.KeyS,
        shortcutsHotkey: ctrlKey | KeyCode.KeyK,
    };
}
