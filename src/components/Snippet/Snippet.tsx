import React from 'react';

import {useThemeValue} from '@gravity-ui/uikit';
import type {editor} from 'monaco-editor';
import 'monaco-yql-languages/build/monaco.contribution';
import MonacoEditor from 'react-monaco-editor';

import {cn} from '../../utils/cn';
import {YQL_LANGUAGE_ID} from '../../utils/monaco/constants';

import './Snippet.scss';

const block = cn('snippet');
const SNIPPET_LENGTH = 7;

export interface SnippetProps {
    className?: string;
    children: string;
    language?: string;
}

export const Snippet = ({
    className,
    children,
    language = YQL_LANGUAGE_ID,
}: SnippetProps): JSX.Element => {
    const themeValue = useThemeValue();
    const theme = `vs-${themeValue}`;

    const editorOptions = React.useMemo<editor.IStandaloneEditorConstructionOptions>(
        () => ({
            readOnly: true,
            minimap: {enabled: false},
            scrollBeyondLastLine: false,
            lineNumbers: 'off' as const,
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
                alwaysConsumeMouseWheel: false,
            },
            renderLineHighlight: 'none' as const,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            lineDecorationsWidth: 0,
            contextmenu: false,
            fontSize: 13,
            lineHeight: 20,
            domReadOnly: true,
        }),
        [],
    );

    return (
        <div className={block(null, className)}>
            <div className={block('content')}>
                <MonacoEditor
                    language={language}
                    theme={theme}
                    value={children}
                    height={SNIPPET_LENGTH * 20}
                    options={editorOptions}
                />
            </div>
        </div>
    );
};
