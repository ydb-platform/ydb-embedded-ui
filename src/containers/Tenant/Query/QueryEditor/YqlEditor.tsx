import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {createMonacoGhostInstance} from '@ydb-platform/monaco-ghost';
import throttle from 'lodash/throttle';
import type Monaco from 'monaco-editor';

import {MonacoEditor} from '../../../../components/MonacoEditor/MonacoEditor';
import {
    goToNextQuery,
    goToPreviousQuery,
    selectQueriesHistory,
    selectUserInput,
    setIsDirty,
} from '../../../../store/reducers/query/query';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {QueryAction} from '../../../../types/store/query';
import {
    useEventHandler,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../utils/hooks';
import {YQL_LANGUAGE_ID} from '../../../../utils/monaco/constats';
import {useUpdateErrorsHighlighting} from '../../../../utils/monaco/highlightErrors';
import {QUERY_ACTIONS} from '../../../../utils/query';
import {SAVE_QUERY_DIALOG} from '../SaveQuery/SaveQuery';
import i18n from '../i18n';

import {useCodeAssistHelpers, useEditorOptions} from './helpers';
import {getKeyBindings} from './keybindings';

const CONTEXT_MENU_GROUP_ID = 'navigation';

interface YqlEditorProps {
    changeUserInput: (arg: {input: string}) => void;
    theme: string;
    handleGetExplainQueryClick: (text: string) => void;
    handleSendExecuteClick: (text: string, partial?: boolean) => void;
}

export function YqlEditor({
    changeUserInput,
    theme,
    handleSendExecuteClick,
    handleGetExplainQueryClick,
}: YqlEditorProps) {
    const input = useTypedSelector(selectUserInput);
    const dispatch = useTypedDispatch();
    const [monacoGhostInstance, setMonacoGhostInstance] =
        React.useState<ReturnType<typeof createMonacoGhostInstance>>();
    const historyQueries = useTypedSelector(selectQueriesHistory);
    const [isCodeAssistEnabled] = useSetting(SETTING_KEYS.ENABLE_CODE_ASSISTANT);

    const editorOptions = useEditorOptions();
    const updateErrorsHighlighting = useUpdateErrorsHighlighting();

    const [lastUsedQueryAction] = useSetting<QueryAction>(SETTING_KEYS.LAST_USED_QUERY_ACTION);

    const getLastQueryText = useEventHandler(() => {
        if (!historyQueries || historyQueries.length === 0) {
            return '';
        }
        return historyQueries[historyQueries.length - 1].queryText;
    });

    const handleSendQuery = useEventHandler(() => {
        if (lastUsedQueryAction === QUERY_ACTIONS.explain) {
            handleGetExplainQueryClick(input);
        } else {
            handleSendExecuteClick(input);
        }
    });

    const editorWillUnmount = () => {
        window.ydbEditor = undefined;
    };

    const {monacoGhostConfig, prepareUserQueriesCache} = useCodeAssistHelpers();

    React.useEffect(() => {
        if (monacoGhostInstance && isCodeAssistEnabled) {
            monacoGhostInstance.register(monacoGhostConfig);
            prepareUserQueriesCache();
        }

        return () => {
            monacoGhostInstance?.unregister();
        };
    }, [isCodeAssistEnabled, monacoGhostConfig, monacoGhostInstance, prepareUserQueriesCache]);
    const editorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
        window.ydbEditor = editor;
        const keybindings = getKeyBindings(monaco);
        monaco.editor.registerCommand('insertSnippetToEditor', (_asessor, input: string) => {
            //suggestController is not properly typed yet in monaco-editor package
            const contribution = editor.getContribution<any>('snippetController2');
            if (contribution) {
                editor.focus();
                editor.setValue('');
                contribution.insert(input);
                dispatch(setIsDirty(false));
            }
        });

        if (window.api.codeAssist) {
            setMonacoGhostInstance(createMonacoGhostInstance(editor));
        }

        initResizeHandler(editor);
        initUserPrompt(editor, getLastQueryText);
        editor.focus();
        editor.addAction({
            id: 'sendQuery',
            label: i18n('action.send-query'),
            keybindings: [keybindings.sendQuery],
            // A precondition for this action.
            precondition: undefined,
            // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
            keybindingContext: undefined,
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 1,
            // Method that will be executed when the action is triggered.
            // @param editor The editor instance is passed in as a convenience
            run: () => handleSendQuery(),
        });

        const canSendSelectedText = editor.createContextKey<boolean>('canSendSelectedText', false);
        editor.onDidChangeCursorSelection(({selection, secondarySelections}) => {
            const notEmpty =
                selection.selectionStartLineNumber !== selection.positionLineNumber ||
                selection.selectionStartColumn !== selection.positionColumn;
            const hasMultipleSelections = secondarySelections.length > 0;
            canSendSelectedText.set(notEmpty && !hasMultipleSelections);
        });
        editor.addAction({
            id: 'sendSelectedQuery',
            label: i18n('action.send-selected-query'),
            keybindings: [keybindings.sendSelectedQuery],
            precondition: 'canSendSelectedText',
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 1,
            run: (e) => {
                const selection = e.getSelection();
                const model = e.getModel();
                if (selection && model) {
                    const text = model.getValueInRange({
                        startLineNumber: selection.getSelectionStart().lineNumber,
                        startColumn: selection.getSelectionStart().column,
                        endLineNumber: selection.getPosition().lineNumber,
                        endColumn: selection.getPosition().column,
                    });
                    handleSendExecuteClick(text, true);
                }
            },
        });

        editor.addAction({
            id: 'previous-query',
            label: i18n('action.previous-query'),
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 2,
            run: () => {
                dispatch(goToPreviousQuery());
            },
        });
        editor.addAction({
            id: 'next-query',
            label: i18n('action.next-query'),
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 3,
            run: () => {
                dispatch(goToNextQuery());
            },
        });
        editor.addAction({
            id: 'save-query',
            label: i18n('action.save-query'),
            keybindings: [keybindings.saveQuery],
            run: () => {
                NiceModal.show(SAVE_QUERY_DIALOG);
            },
        });
        editor.addAction({
            id: 'openKeyboardShortcutsPanel',
            label: i18n('action.open-shortcuts'),
            keybindings: [keybindings.shortcutsHotkey],
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 4,
            run: () => {
                // Dispatch an event that can be caught by the AsideNavigation component
                const event = new CustomEvent('openKeyboardShortcutsPanel');
                window.dispatchEvent(event);
            },
        });
    };

    const onChange = (newValue: string) => {
        updateErrorsHighlighting();
        changeUserInput({input: newValue});
        dispatch(setIsDirty(true));
    };
    return (
        <MonacoEditor
            language={YQL_LANGUAGE_ID}
            value={input}
            options={editorOptions}
            onChange={onChange}
            editorDidMount={editorDidMount}
            theme={`vs-${theme}`}
            editorWillUnmount={editorWillUnmount}
        />
    );
}

function initResizeHandler(editor: Monaco.editor.IStandaloneCodeEditor) {
    const layoutEditor = throttle(() => {
        editor.layout();
    }, 100);

    editor.layout();

    window.addEventListener('resize', layoutEditor);
    editor.onDidDispose(() => {
        window.removeEventListener('resize', layoutEditor);
    });
}

function initUserPrompt(editor: Monaco.editor.IStandaloneCodeEditor, getInitialText: () => string) {
    setUserPrompt(editor.getValue(), getInitialText());
    editor.onDidChangeModelContent(() => {
        setUserPrompt(editor.getValue(), getInitialText());
    });
    editor.onDidDispose(() => {
        window.onbeforeunload = null;
    });
}

function setUserPrompt(text: string, initialText: string) {
    const hasUnsavedInput = text ? text !== initialText : false;

    if (hasUnsavedInput) {
        window.onbeforeunload = (e) => {
            e.preventDefault();
            // Chrome requires returnValue to be set
            e.returnValue = '';
        };
    } else {
        window.onbeforeunload = null;
    }
}
