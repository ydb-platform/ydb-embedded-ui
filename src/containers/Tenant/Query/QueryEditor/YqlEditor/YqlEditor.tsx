import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {createMonacoGhostInstance} from '@ydb-platform/monaco-ghost';
import throttle from 'lodash/throttle';
import type Monaco from 'monaco-editor';

import {MonacoEditor} from '../../../../../components/MonacoEditor/MonacoEditor';
import {
    closeQueryTab,
    renameQueryTab,
    selectActiveTab,
    selectUserInput,
    setIsDirty,
} from '../../../../../store/reducers/query/query';
import type {QueryInHistory} from '../../../../../store/reducers/query/types';
import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import type {QueryAction} from '../../../../../types/store/query';
import {uiFactory} from '../../../../../uiFactory/uiFactory';
import {
    useEventHandler,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../../utils/hooks';
import {YQL_LANGUAGE_ID} from '../../../../../utils/monaco/constats';
import {useUpdateErrorsHighlighting} from '../../../../../utils/monaco/highlightErrors';
import {QUERY_ACTIONS} from '../../../../../utils/query';
import {SAVE_QUERY_DIALOG} from '../../SaveQuery/SaveQuery';
import i18n from '../../i18n';
import {useSavedQueries} from '../../utils/useSavedQueries';
import {RENAME_TAB_DIALOG} from '../EditorTabs/RenameTabDialog';
import {useCodeAssistHelpers} from '../hooks/useCodeAssistHelpers';
import {useEditorOptions} from '../hooks/useEditorOptions';
import {useQueryTabsActions} from '../hooks/useQueryTabsActions';
import {queryExecutionManagerInstance} from '../utils/queryExecutionManager';
import {TabsManager} from '../utils/tabsManager';

import {getKeyBindings} from './keybindings';

const CONTEXT_MENU_GROUP_ID = 'navigation';

type SnippetController = {insert: (snippet: string) => void};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isSnippetController(value: unknown): value is SnippetController {
    if (!isRecord(value)) {
        return false;
    }
    return typeof value.insert === 'function';
}

interface YqlEditorProps {
    changeUserInput: (arg: {input: string}) => void;
    theme: string;
    handleGetExplainQueryClick: (text: string) => void;
    handleSendExecuteClick: (text: string, partial?: boolean) => void;
    historyQueries: QueryInHistory[];
    goToPreviousQuery: () => void;
    goToNextQuery: () => void;
}

export function YqlEditor({
    changeUserInput,
    theme,
    handleSendExecuteClick,
    handleGetExplainQueryClick,
    historyQueries,
    goToPreviousQuery,
    goToNextQuery,
}: YqlEditorProps) {
    const input = useTypedSelector(selectUserInput);
    const activeTab = useTypedSelector(selectActiveTab);
    const {savedQueries, saveQuery} = useSavedQueries();
    const {
        activeTabId,
        tabsOrder,
        handleNewTabClick,
        handleCloseActiveTab,
        handleNextTab,
        handlePreviousTab,
    } = useQueryTabsActions();
    const dispatch = useTypedDispatch();
    const [monacoGhostInstance, setMonacoGhostInstance] =
        React.useState<ReturnType<typeof createMonacoGhostInstance>>();
    const [isCodeAssistEnabled] = useSetting(SETTING_KEYS.ENABLE_CODE_ASSISTANT);

    const editorOptions = useEditorOptions();
    const updateErrorsHighlighting = useUpdateErrorsHighlighting();

    const editorRef = React.useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = React.useRef<typeof Monaco | null>(null);
    const tabsManagerRef = React.useRef(new TabsManager());
    const programmaticValueRef = React.useRef<string | null>(null);
    const skipDirtyOnceRef = React.useRef(false);

    const isMultiTabQueryEditorEnabled = Boolean(uiFactory.enableMultiTabQueryEditor);

    React.useEffect(() => {
        if (!isMultiTabQueryEditorEnabled) {
            return;
        }

        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) {
            return;
        }

        tabsManagerRef.current.setActiveTabModel({
            tabId: activeTabId,
            nextValue: input,
            editor,
            monaco,
            onBeforeSetValue: (nextValue) => {
                programmaticValueRef.current = nextValue;
            },
        });
    }, [activeTabId, input, isMultiTabQueryEditorEnabled]);

    React.useEffect(() => {
        if (!isMultiTabQueryEditorEnabled) {
            return;
        }

        tabsManagerRef.current.disposeRemovedTabs(tabsOrder);
    }, [isMultiTabQueryEditorEnabled, tabsOrder]);

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

    const handleNewTabAction = useEventHandler(() => {
        handleNewTabClick();
    });

    const handleCloseActiveTabAction = useEventHandler(() => {
        handleCloseActiveTab();
    });

    const handleNextTabAction = useEventHandler(() => {
        handleNextTab();
    });

    const handlePreviousTabAction = useEventHandler(() => {
        handlePreviousTab();
    });

    const closeTabById = React.useCallback(
        (tabId: string) => {
            queryExecutionManagerInstance.abortQuery(tabId);
            dispatch(closeQueryTab({tabId}));
        },
        [dispatch],
    );

    const handleCloseOtherTabsAction = useEventHandler(() => {
        tabsOrder.filter((tabId) => tabId !== activeTabId).forEach(closeTabById);
    });

    const handleCloseAllTabsAction = useEventHandler(() => {
        tabsOrder.forEach(closeTabById);
    });

    const handleRenameTabAction = useEventHandler(() => {
        const tabIdToRename = activeTabId;
        NiceModal.show(RENAME_TAB_DIALOG, {
            title: activeTab?.title || '',
            onRename: (title: string) => {
                dispatch(renameQueryTab({tabId: tabIdToRename, title}));
            },
        });
    });

    const handleSaveQueryAsAction = useEventHandler(() => {
        const commonModalProps = {savedQueries, onSaveQuery: saveQuery} as const;
        if (activeTab?.isTitleUserDefined) {
            NiceModal.show(SAVE_QUERY_DIALOG, {
                ...commonModalProps,
                defaultQueryName: activeTab.title,
            });
            return;
        }

        NiceModal.show(SAVE_QUERY_DIALOG, commonModalProps);
    });

    const editorWillUnmount = () => {
        window.ydbEditor = undefined;
        tabsManagerRef.current.disposeAll();
        editorRef.current = null;
        monacoRef.current = null;
    };

    const {monacoGhostConfig, prepareUserQueriesCache} = useCodeAssistHelpers(historyQueries);

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
        editorRef.current = editor;
        monacoRef.current = monaco;

        if (isMultiTabQueryEditorEnabled) {
            tabsManagerRef.current.setActiveTabModel({
                tabId: activeTabId,
                nextValue: input,
                editor,
                monaco,
                onBeforeSetValue: (nextValue) => {
                    programmaticValueRef.current = nextValue;
                },
            });
        }

        const keybindings = getKeyBindings(monaco);
        monaco.editor.registerCommand('insertSnippetToEditor', (_asessor, snippet: string) => {
            //suggestController is not properly typed yet in monaco-editor package
            const contribution =
                editor.getContribution<Monaco.editor.IEditorContribution>('snippetController2');
            if (isSnippetController(contribution)) {
                editor.focus();
                skipDirtyOnceRef.current = true;
                editor.setValue('');
                skipDirtyOnceRef.current = true;
                contribution.insert(snippet);
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
                goToPreviousQuery();
            },
        });
        editor.addAction({
            id: 'next-query',
            label: i18n('action.next-query'),
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 3,
            run: () => {
                goToNextQuery();
            },
        });
        editor.addAction({
            id: 'save-query',
            label: i18n('action.save-query'),
            keybindings: [keybindings.saveQuery],
            run: () => handleSaveQueryAsAction(),
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

        if (isMultiTabQueryEditorEnabled) {
            editor.addAction({
                id: 'newEditorTab',
                label: i18n('editor-tabs.action.new-tab'),
                keybindings: [keybindings.newTab],
                run: () => handleNewTabAction(),
            });
            editor.addAction({
                id: 'closeEditorTab',
                label: i18n('editor-tabs.action.close-tab'),
                keybindings: [keybindings.closeTab],
                run: () => handleCloseActiveTabAction(),
            });
            editor.addAction({
                id: 'renameEditorTab',
                label: i18n('editor-tabs.rename'),
                keybindings: [keybindings.renameTab],
                run: () => handleRenameTabAction(),
            });
            editor.addAction({
                id: 'nextEditorTab',
                label: i18n('editor-tabs.action.next-tab'),
                keybindings: [keybindings.nextTab],
                run: () => handleNextTabAction(),
            });
            editor.addAction({
                id: 'previousEditorTab',
                label: i18n('editor-tabs.action.previous-tab'),
                keybindings: [keybindings.previousTab],
                run: () => handlePreviousTabAction(),
            });
            editor.addAction({
                id: 'closeOtherEditorTabs',
                label: i18n('editor-tabs.close-other-tabs'),
                keybindings: [keybindings.closeOtherTabs],
                run: () => handleCloseOtherTabsAction(),
            });
            editor.addAction({
                id: 'closeAllEditorTabs',
                label: i18n('editor-tabs.close-all-tabs'),
                keybindings: [keybindings.closeAllTabs],
                run: () => handleCloseAllTabsAction(),
            });
            editor.addAction({
                id: 'saveQueryAs',
                label: i18n('editor-tabs.save-query-as'),
                keybindings: [keybindings.saveQueryAs],
                run: () => handleSaveQueryAsAction(),
            });
        }
    };

    const onChange = (newValue: string) => {
        updateErrorsHighlighting();
        if (programmaticValueRef.current === newValue) {
            programmaticValueRef.current = null;
            return;
        }
        changeUserInput({input: newValue});
        if (skipDirtyOnceRef.current) {
            skipDirtyOnceRef.current = false;
            dispatch(setIsDirty(false));
            return;
        }
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
            const unloadEvent = e;
            unloadEvent.returnValue = '';
        };
    } else {
        window.onbeforeunload = null;
    }
}
