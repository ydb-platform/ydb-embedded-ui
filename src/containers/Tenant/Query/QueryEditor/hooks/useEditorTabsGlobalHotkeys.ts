import React from 'react';

import hotkeys from 'hotkeys-js';

import {HOTKEY_LABELS, toHotkeysJsFormat} from '../constants';

interface EditorTabsGlobalHotkeysHandlers {
    handleNewTab: () => void;
    handleCloseActiveTab: () => void;
    handleRenameTab: () => void;
    handleDuplicateTab: () => void;
    handleNextTab: () => void;
    handlePreviousTab: () => void;
    handleCloseOtherTabs: () => void;
    handleCloseAllTabs: () => void;
    handleSaveQueryAs: () => void;
}

/**
 * Registers global keyboard shortcuts for editor tab management.
 *
 * These hotkeys work when focus is outside Monaco editor (e.g. on tabs, result pane, controls).
 * When Monaco editor is focused, its own `addAction` keybindings handle the same shortcuts —
 * no double-firing occurs because `hotkeys-js` ignores events from `<textarea>` elements by default,
 * and Monaco uses a hidden `<textarea>` for keyboard input.
 */
export function useEditorTabsGlobalHotkeys(
    enabled: boolean,
    handlers: EditorTabsGlobalHotkeysHandlers,
) {
    const handlersRef = React.useRef(handlers);
    React.useLayoutEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    React.useEffect(() => {
        if (!enabled) {
            return;
        }

        const bindings: Array<{combo: string; handler: (e: KeyboardEvent) => void}> = [
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.newTab),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handleNewTab();
                },
            },
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.closeTab),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handleCloseActiveTab();
                },
            },
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.renameTab),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handleRenameTab();
                },
            },
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.duplicateTab),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handleDuplicateTab();
                },
            },
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.nextTab),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handleNextTab();
                },
            },
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.previousTab),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handlePreviousTab();
                },
            },
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.closeOtherTabs),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handleCloseOtherTabs();
                },
            },
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.closeAllTabs),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handleCloseAllTabs();
                },
            },
            {
                combo: toHotkeysJsFormat(HOTKEY_LABELS.saveQueryAs),
                handler: (e) => {
                    e.preventDefault();
                    handlersRef.current.handleSaveQueryAs();
                },
            },
        ];

        for (const {combo, handler} of bindings) {
            hotkeys(combo, handler);
        }

        return () => {
            for (const {combo} of bindings) {
                hotkeys.unbind(combo);
            }
        };
    }, [enabled]);
}
