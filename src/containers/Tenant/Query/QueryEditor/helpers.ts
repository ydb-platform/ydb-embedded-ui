import React from 'react';

import type Monaco from 'monaco-editor';

import {AUTOCOMPLETE_ON_ENTER, ENABLE_AUTOCOMPLETE} from '../../../../utils/constants';
import {useSetting} from '../../../../utils/hooks';

export type EditorOptions = Monaco.editor.IEditorOptions & Monaco.editor.IGlobalEditorOptions;

export const EDITOR_OPTIONS: EditorOptions = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    minimap: {
        enabled: false,
    },
};

export function useEditorOptions() {
    const [enableAutocomplete] = useSetting(ENABLE_AUTOCOMPLETE);
    const [autocompleteOnEnter] = useSetting(AUTOCOMPLETE_ON_ENTER);

    const options = React.useMemo<EditorOptions>(() => {
        const useAutocomplete = Boolean(enableAutocomplete);
        return {
            quickSuggestions: useAutocomplete,
            suggestOnTriggerCharacters: useAutocomplete,
            acceptSuggestionOnEnter: autocompleteOnEnter ? 'on' : 'off',
            ...EDITOR_OPTIONS,
        };
    }, [enableAutocomplete, autocompleteOnEnter]);

    return options;
}
