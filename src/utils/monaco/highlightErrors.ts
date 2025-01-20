import React from 'react';

import {parseYqlQueryWithoutCursor} from '@gravity-ui/websql-autocomplete/yql';
import {debounce} from 'lodash';
import {MarkerSeverity, editor} from 'monaco-editor';

import {useCancellableFunction} from '../hooks/useCancellable';

import i18n from './i18n';

const owner = 'ydb';

const debouncedHighlightErrors = debounce(highlightErrors, 500);

export function useUpdateErrorsHighlighting() {
    const highlightErrors = useCancellableFunction(debouncedHighlightErrors);
    const updateErrorsHighlighting = React.useCallback(() => {
        unHighlightErrors();

        highlightErrors();
    }, [highlightErrors]);
    return updateErrorsHighlighting;
}

function highlightErrors() {
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
            message: i18n('context_syntax-error'),
            source: error.message,
            severity: MarkerSeverity.Error,
            startLineNumber: error.startLine,
            startColumn: error.startColumn + 1,
            endLineNumber: error.endLine,
            endColumn: error.endColumn + 1,
        }),
    );
    editor.setModelMarkers(model, owner, markers);
}

function unHighlightErrors(): void {
    editor.removeAllMarkers(owner);
}
