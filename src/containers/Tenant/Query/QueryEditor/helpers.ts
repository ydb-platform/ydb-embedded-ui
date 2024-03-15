import type Monaco from 'monaco-editor';
import {ENABLE_AUTOCOMPLETE, useSetting} from '../../../../lib';
import {useMemo} from 'react';

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

    const options = useMemo<EditorOptions>(() => {
        const useAutocomplete = Boolean(enableAutocomplete);
        return {
            quickSuggestions: useAutocomplete,
            suggestOnTriggerCharacters: useAutocomplete,
            ...EDITOR_OPTIONS,
        };
    }, [enableAutocomplete]);

    return options;
}
