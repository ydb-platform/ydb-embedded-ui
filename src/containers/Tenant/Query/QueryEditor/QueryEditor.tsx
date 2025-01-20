import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {isEqual} from 'lodash';
import throttle from 'lodash/throttle';
import type Monaco from 'monaco-editor';
import {v4 as uuidv4} from 'uuid';

import {MonacoEditor} from '../../../../components/MonacoEditor/MonacoEditor';
import SplitPane from '../../../../components/SplitPane';
import {useTracingLevelOptionAvailable} from '../../../../store/reducers/capabilities/hooks';
import {
    goToNextQuery,
    goToPreviousQuery,
    queryApi,
    saveQueryToHistory,
    selectQueriesHistory,
    selectQueriesHistoryCurrentIndex,
    selectResult,
    selectTenantPath,
    selectUserInput,
    setTenantPath,
} from '../../../../store/reducers/query/query';
import type {QueryResult} from '../../../../store/reducers/query/types';
import {setQueryAction} from '../../../../store/reducers/queryActions/queryActions';
import {selectShowPreview, setShowPreview} from '../../../../store/reducers/schema/schema';
import type {EPathType} from '../../../../types/api/schema';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {
    DEFAULT_IS_QUERY_RESULT_COLLAPSED,
    DEFAULT_SIZE_RESULT_PANE_KEY,
    LAST_USED_QUERY_ACTION_KEY,
} from '../../../../utils/constants';
import {
    useEventHandler,
    useQueryExecutionSettings,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../utils/hooks';
import {useChangedQuerySettings} from '../../../../utils/hooks/useChangedQuerySettings';
import {useLastQueryExecutionSettings} from '../../../../utils/hooks/useLastQueryExecutionSettings';
import {YQL_LANGUAGE_ID} from '../../../../utils/monaco/constats';
import {useUpdateErrorsHighlighting} from '../../../../utils/monaco/highlightErrors';
import {QUERY_ACTIONS} from '../../../../utils/query';
import type {InitialPaneState} from '../../utils/paneVisibilityToggleHelpers';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from '../../utils/paneVisibilityToggleHelpers';
import {Preview} from '../Preview/Preview';
import {QueryEditorControls} from '../QueryEditorControls/QueryEditorControls';
import {QueryResultViewer} from '../QueryResult/QueryResultViewer';
import {QuerySettingsDialog} from '../QuerySettingsDialog/QuerySettingsDialog';
import {SAVE_QUERY_DIALOG} from '../SaveQuery/SaveQuery';
import i18n from '../i18n';

import {useEditorOptions} from './helpers';
import {getKeyBindings} from './keybindings';

import './QueryEditor.scss';

const CONTEXT_MENU_GROUP_ID = 'navigation';

const b = cn('query-editor');

const initialTenantCommonInfoState = {
    triggerExpand: false,
    triggerCollapse: false,
    collapsed: true,
};

interface QueryEditorProps {
    tenantName: string;
    path: string;
    changeUserInput: (arg: {input: string}) => void;
    theme: string;
    type?: EPathType;
}

export default function QueryEditor(props: QueryEditorProps) {
    const editorOptions = useEditorOptions();
    const dispatch = useTypedDispatch();
    const {tenantName, path, type, theme, changeUserInput} = props;
    const savedPath = useTypedSelector(selectTenantPath);
    const result = useTypedSelector(selectResult);
    const historyQueries = useTypedSelector(selectQueriesHistory);
    const historyCurrentIndex = useTypedSelector(selectQueriesHistoryCurrentIndex);
    const input = useTypedSelector(selectUserInput);
    const showPreview = useTypedSelector(selectShowPreview);

    const updateErrorsHighlighting = useUpdateErrorsHighlighting();

    const isResultLoaded = Boolean(result);

    const [querySettings] = useQueryExecutionSettings();
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [lastQueryExecutionSettings, setLastQueryExecutionSettings] =
        useLastQueryExecutionSettings();
    const {resetBanner} = useChangedQuerySettings();

    const [lastUsedQueryAction, setLastUsedQueryAction] = useSetting<QueryAction>(
        LAST_USED_QUERY_ACTION_KEY,
    );

    const [sendQuery] = queryApi.useUseSendQueryMutation();

    React.useEffect(() => {
        if (savedPath !== tenantName) {
            dispatch(setTenantPath(tenantName));
        }
    }, [dispatch, tenantName, savedPath]);

    const [resultVisibilityState, dispatchResultVisibilityState] = React.useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_QUERY_RESULT_COLLAPSED),
        initialTenantCommonInfoState,
    );

    React.useEffect(() => {
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
    }, []);

    React.useEffect(() => {
        if (showPreview || isResultLoaded) {
            dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
        } else {
            dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
        }
    }, [showPreview, isResultLoaded]);

    const getLastQueryText = useEventHandler(() => {
        if (!historyQueries || historyQueries.length === 0) {
            return '';
        }
        return historyQueries[historyQueries.length - 1].queryText;
    });

    const handleSendExecuteClick = useEventHandler((text?: string) => {
        const query = text ?? input;

        setLastUsedQueryAction(QUERY_ACTIONS.execute);
        if (!isEqual(lastQueryExecutionSettings, querySettings)) {
            resetBanner();
            setLastQueryExecutionSettings(querySettings);
        }
        const queryId = uuidv4();

        sendQuery({
            actionType: 'execute',
            query,
            database: tenantName,
            querySettings,
            enableTracingLevel,
            queryId,
        });

        dispatch(setShowPreview(false));

        // Don't save partial queries in history
        if (!text) {
            if (query !== historyQueries[historyCurrentIndex]?.queryText) {
                dispatch(saveQueryToHistory({queryText: input, queryId}));
            }
        }
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    });

    const handleSettingsClick = () => {
        dispatch(setQueryAction('settings'));
    };

    const handleGetExplainQueryClick = useEventHandler(() => {
        setLastUsedQueryAction(QUERY_ACTIONS.explain);

        if (!isEqual(lastQueryExecutionSettings, querySettings)) {
            resetBanner();
            setLastQueryExecutionSettings(querySettings);
        }

        const queryId = uuidv4();

        sendQuery({
            actionType: 'explain',
            query: input,
            database: tenantName,
            querySettings,
            enableTracingLevel,
            queryId,
        });

        dispatch(setShowPreview(false));

        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    });

    const handleSendQuery = useEventHandler(() => {
        if (lastUsedQueryAction === QUERY_ACTIONS.explain) {
            handleGetExplainQueryClick();
        } else {
            handleSendExecuteClick();
        }
    });

    const editorWillUnmount = () => {
        window.ydbEditor = undefined;
    };

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
            }
        });
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
                    handleSendExecuteClick(text);
                }
            },
        });

        editor.addAction({
            id: 'previous-query',
            label: i18n('action.previous-query'),
            keybindings: [keybindings.selectPreviousQuery],
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 2,
            run: () => {
                dispatch(goToPreviousQuery());
            },
        });
        editor.addAction({
            id: 'next-query',
            label: i18n('action.next-query'),
            keybindings: [keybindings.selectNextQuery],
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
    };

    const onChange = (newValue: string) => {
        updateErrorsHighlighting();
        changeUserInput({input: newValue});
    };

    const onCollapseResultHandler = () => {
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
    };
    const onExpandResultHandler = () => {
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    };

    const onSplitStartDragAdditional = () => {
        dispatchResultVisibilityState(PaneVisibilityActionTypes.clear);
    };

    const renderControls = () => {
        return (
            <QueryEditorControls
                handleSendExecuteClick={handleSendExecuteClick}
                onSettingsButtonClick={handleSettingsClick}
                isLoading={Boolean(result?.isLoading)}
                handleGetExplainQueryClick={handleGetExplainQueryClick}
                disabled={!input}
                highlightedAction={lastUsedQueryAction}
            />
        );
    };

    return (
        <div className={b()}>
            <SplitPane
                direction="vertical"
                defaultSizePaneKey={DEFAULT_SIZE_RESULT_PANE_KEY}
                triggerCollapse={resultVisibilityState.triggerCollapse}
                triggerExpand={resultVisibilityState.triggerExpand}
                minSize={[0, 52]}
                collapsedSizes={[100, 0]}
                onSplitStartDragAdditional={onSplitStartDragAdditional}
            >
                <div
                    className={b('pane-wrapper', {
                        top: true,
                    })}
                >
                    <div className={b('monaco-wrapper')}>
                        <div className={b('monaco')}>
                            <MonacoEditor
                                language={YQL_LANGUAGE_ID}
                                value={input}
                                options={editorOptions}
                                onChange={onChange}
                                editorDidMount={editorDidMount}
                                theme={`vs-${theme}`}
                                editorWillUnmount={editorWillUnmount}
                            />
                        </div>
                    </div>
                    {renderControls()}
                </div>
                <div className={b('pane-wrapper')}>
                    <Result
                        resultVisibilityState={resultVisibilityState}
                        onExpandResultHandler={onExpandResultHandler}
                        onCollapseResultHandler={onCollapseResultHandler}
                        type={type}
                        theme={theme}
                        key={result?.queryId}
                        result={result}
                        tenantName={tenantName}
                        path={path}
                        showPreview={showPreview}
                    />
                </div>
            </SplitPane>
            <QuerySettingsDialog />
        </div>
    );
}

interface ResultProps {
    resultVisibilityState: InitialPaneState;
    onExpandResultHandler: VoidFunction;
    onCollapseResultHandler: VoidFunction;
    type?: EPathType;
    theme: string;
    result?: QueryResult;
    tenantName: string;
    path: string;
    showPreview?: boolean;
}
function Result({
    resultVisibilityState,
    onExpandResultHandler,
    onCollapseResultHandler,
    type,
    theme,
    result,
    tenantName,
    path,
    showPreview,
}: ResultProps) {
    if (showPreview) {
        return <Preview database={tenantName} path={path} type={type} />;
    }

    if (result) {
        return (
            <QueryResultViewer
                result={result}
                resultType={result?.type}
                theme={theme}
                tenantName={tenantName}
                isResultsCollapsed={resultVisibilityState.collapsed}
                onExpandResults={onExpandResultHandler}
                onCollapseResults={onCollapseResultHandler}
            />
        );
    }

    return null;
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
