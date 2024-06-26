import type Monaco from 'monaco-editor';

import {userOs} from '../../../../utils/getUserOS';

export function getKeyBindings(monaco: typeof Monaco) {
    const {KeyMod, KeyCode} = monaco;

    const ctrlKey = userOs === 'mac' ? KeyMod.CtrlCmd : KeyMod.WinCtrl;

    /* eslint-disable no-bitwise */
    return {
        sendQuery: ctrlKey | KeyCode.Enter,
        sendSelectedQuery: ctrlKey | KeyMod.Shift | monaco.KeyCode.Enter,
        selectPreviousQuery: ctrlKey | KeyCode.UpArrow,
        selectNextQuery: ctrlKey | KeyCode.DownArrow,
        saveQuery: ctrlKey | KeyCode.KeyS,
        saveSelectedQuery: ctrlKey | KeyMod.Shift | KeyCode.KeyS,
    };
}
