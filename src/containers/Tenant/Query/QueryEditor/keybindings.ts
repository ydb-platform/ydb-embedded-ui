/* eslint-disable no-bitwise */
import {monaco} from 'react-monaco-editor';

import {getUserOS} from '../../../../utils/getUserOS';

const {KeyMod, KeyCode} = monaco;

const getCtrlKey = () => {
    return getUserOS() === 'mac' ? KeyMod.CtrlCmd : KeyMod.WinCtrl;
};

export const keybindings = {
    sendQuery: getCtrlKey() | KeyCode.Enter,
    sendSelectedQuery: getCtrlKey() | KeyMod.Shift | monaco.KeyCode.Enter,
    selectPreviousQuery: getCtrlKey() | KeyCode.UpArrow,
    selectNextQuery: getCtrlKey() | KeyCode.DownArrow,
    saveQuery: getCtrlKey() | KeyCode.KeyS,
    saveSelectedQuery: getCtrlKey() | KeyMod.Shift | KeyCode.KeyS,
};
