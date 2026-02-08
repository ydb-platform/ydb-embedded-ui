import React from 'react';

import type Monaco from 'monaco-editor';

import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import {uiFactory} from '../../../../../uiFactory/uiFactory';
import {useSetting} from '../../../../../utils/hooks';

export type EditorOptions = Monaco.editor.IEditorOptions & Monaco.editor.IGlobalEditorOptions;

const MULTI_TAB_EDITOR_PADDING_TOP_PX = 6;

const EDITOR_OPTIONS: EditorOptions = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    minimap: {
        enabled: false,
    },
    fixedOverflowWidgets: true,
};

export function useEditorOptions() {
    const [enableAutocomplete] = useSetting(SETTING_KEYS.ENABLE_AUTOCOMPLETE);
    const [autocompleteOnEnter] = useSetting(SETTING_KEYS.AUTOCOMPLETE_ON_ENTER);

    const options = React.useMemo<EditorOptions>(() => {
        const useAutocomplete = Boolean(enableAutocomplete);
        const baseOptions: EditorOptions = {
            quickSuggestions: useAutocomplete,
            suggestOnTriggerCharacters: useAutocomplete,
            acceptSuggestionOnEnter: autocompleteOnEnter ? 'on' : 'off',
            ...EDITOR_OPTIONS,
        };

        const isMultiTabQueryEditorEnabled = Boolean(uiFactory.enableMultiTabQueryEditor);
        if (!isMultiTabQueryEditorEnabled) {
            return baseOptions;
        }

        return {
            ...baseOptions,
            padding: {top: MULTI_TAB_EDITOR_PADDING_TOP_PX},
            scrollBeyondLastLine: false,
        };
    }, [enableAutocomplete, autocompleteOnEnter]);

    return options;
}
