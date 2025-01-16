import {parseYqlQueryWithoutCursor} from '@gravity-ui/websql-autocomplete/yql';
import {MarkerSeverity, editor} from 'monaco-editor';

const owner = 'ydb';

let errorsHighlightingTimeoutId: ReturnType<typeof setTimeout>;

export function disableErrorsHighlighting(): void {
    unHighlightErrors();
}

export function updateErrorsHighlighting(): void {
    disableErrorsHighlighting();

    clearTimeout(errorsHighlightingTimeoutId);
    errorsHighlightingTimeoutId = setTimeout(() => highlightErrors(), 500);
}

function highlightErrors(): void {
    const model = window.ydbEditor?.getModel();
    if (!model) {
        console.error('unable to retrieve model when highlighting errors');
        return;
    }

    const errors = parseYqlQueryWithoutCursor(model.getValue()).errors;
    if (!errors.length) {
        unHighlightErrors();
        return;
    }

    const markers = errors.map(
        (error): editor.IMarkerData => ({
            message: 'Syntax error',
            source: error.message,
            severity: MarkerSeverity.Error,
            startLineNumber: error.startLine,
            startColumn: convertAutocompleteErrorLocationIndexToMonacoIndex(error.startColumn),
            endLineNumber: error.endLine,
            endColumn: convertAutocompleteErrorLocationIndexToMonacoIndex(error.endColumn),
        }),
    );
    editor.setModelMarkers(model, owner, markers);
}

function unHighlightErrors(): void {
    editor.removeAllMarkers(owner);
}

function convertAutocompleteErrorLocationIndexToMonacoIndex(
    autocompleteLocationIndex: number,
): number {
    return autocompleteLocationIndex + 1;
}
