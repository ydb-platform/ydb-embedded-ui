import React from 'react';

import throttle from 'lodash/throttle';
import type Monaco from 'monaco-editor';
import {connect} from 'react-redux';

import {MonacoEditor} from '../../../../components/MonacoEditor/MonacoEditor';
import SplitPane from '../../../../components/SplitPane';
import type {RootState} from '../../../../store';
import {
    executeQueryApi,
    goToNextQuery,
    goToPreviousQuery,
    saveQueryToHistory,
    setTenantPath,
} from '../../../../store/reducers/executeQuery';
import {explainQueryApi} from '../../../../store/reducers/explainQuery/explainQuery';
import type {PreparedExplainResponse} from '../../../../store/reducers/explainQuery/types';
import {setShowPreview} from '../../../../store/reducers/schema/schema';
import type {EPathType} from '../../../../types/api/schema';
import type {ValueOf} from '../../../../types/common';
import type {ExecuteQueryState} from '../../../../types/store/executeQuery';
import type {IQueryResult, QueryAction, QueryMode} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {
    DEFAULT_IS_QUERY_RESULT_COLLAPSED,
    DEFAULT_SIZE_RESULT_PANE_KEY,
    LAST_USED_QUERY_ACTION_KEY,
    QUERY_USE_MULTI_SCHEMA_KEY,
} from '../../../../utils/constants';
import {useQueryModes, useSetting} from '../../../../utils/hooks';
import {LANGUAGE_YQL_ID} from '../../../../utils/monaco/yql/constants';
import {QUERY_ACTIONS} from '../../../../utils/query';
import type {InitialPaneState} from '../../utils/paneVisibilityToggleHelpers';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from '../../utils/paneVisibilityToggleHelpers';
import {ExecuteResult} from '../ExecuteResult/ExecuteResult';
import {ExplainResult} from '../ExplainResult/ExplainResult';
import {Preview} from '../Preview/Preview';
import {useSaveQuery, useSetQueryAction} from '../QueryContext';
import {QueryEditorControls} from '../QueryEditorControls/QueryEditorControls';
import {SaveQueryDialog} from '../SaveQuery/SaveQuery';
import i18n from '../i18n';

import {useEditorOptions} from './helpers';
import {getKeyBindings} from './keybindings';

import './QueryEditor.scss';

const CONTEXT_MENU_GROUP_ID = 'navigation';
const RESULT_TYPES = {
    EXECUTE: 'execute',
    EXPLAIN: 'explain',
};
const MONACO_HOT_KEY_ACTIONS = {
    sendQuery: 'sendQuery',
    sendSelectedQuery: 'sendSelectedQuery',
};

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
    goToNextQuery: (...args: Parameters<typeof goToNextQuery>) => void;
    goToPreviousQuery: (...args: Parameters<typeof goToPreviousQuery>) => void;
    setTenantPath: (...args: Parameters<typeof setTenantPath>) => void;
    executeQuery: ExecuteQueryState;
    theme: string;
    type?: EPathType;
    showPreview: boolean;
    setShowPreview: (...args: Parameters<typeof setShowPreview>) => void;
    saveQueryToHistory: (...args: Parameters<typeof saveQueryToHistory>) => void;
}

function QueryEditor(props: QueryEditorProps) {
    const editorOptions = useEditorOptions();
    const saveQuery = useSaveQuery();
    const setQueryAction = useSetQueryAction();
    const {
        tenantName,
        path,
        setTenantPath: setPath,
        executeQuery,
        type,
        theme,
        changeUserInput,
        showPreview,
    } = props;
    const {tenantPath: savedPath} = executeQuery;

    const [resultType, setResultType] = React.useState(RESULT_TYPES.EXECUTE);

    const [isResultLoaded, setIsResultLoaded] = React.useState(false);
    const [queryMode, setQueryMode] = useQueryModes();
    const [useMultiSchema] = useSetting(QUERY_USE_MULTI_SCHEMA_KEY);
    const [lastUsedQueryAction, setLastUsedQueryAction] = useSetting<QueryAction>(
        LAST_USED_QUERY_ACTION_KEY,
    );
    const [monacoHotKey, setMonacoHotKey] = React.useState<ValueOf<
        typeof MONACO_HOT_KEY_ACTIONS
    > | null>(null);

    const [sendExecuteQuery, executeQueryResult] = executeQueryApi.useExecuteQueryMutation();
    const [sendExplainQuery, explainQueryResult] = explainQueryApi.useExplainQueryMutation();

    React.useEffect(() => {
        if (savedPath !== tenantName) {
            if (savedPath) {
                changeUserInput({input: ''});
            }
            setPath(tenantName);
        }
    }, [changeUserInput, setPath, tenantName, savedPath]);

    const [resultVisibilityState, dispatchResultVisibilityState] = React.useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_QUERY_RESULT_COLLAPSED),
        initialTenantCommonInfoState,
    );

    const editorRef = React.useRef<Monaco.editor.IStandaloneCodeEditor>();

    React.useEffect(() => {
        const updateEditor = () => {
            if (editorRef.current) {
                editorRef.current.layout();
            }
        };

        const onChangeWindow = throttle(() => {
            updateEditor();
        }, 100);

        updateEditor();

        window.addEventListener('resize', onChangeWindow);
        return () => {
            window.removeEventListener('resize', onChangeWindow);
        };
    }, []);

    React.useEffect(() => {
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
    }, []);

    React.useEffect(() => {
        if (props.showPreview || isResultLoaded) {
            dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
        } else {
            dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
        }
    }, [props.showPreview, isResultLoaded]);

    React.useEffect(() => {
        const {input, history} = executeQuery;

        const hasUnsavedInput = input
            ? input !== history.queries[history.queries.length - 1]?.queryText
            : false;

        if (hasUnsavedInput) {
            window.onbeforeunload = (e) => {
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
            };
        } else {
            window.onbeforeunload = null;
        }
        return () => {
            window.onbeforeunload = null;
        };
    }, [executeQuery]);

    const handleSendExecuteClick = (mode: QueryMode | undefined, text?: string) => {
        if (!mode) {
            return;
        }
        const {input, history} = executeQuery;

        const schema = useMultiSchema ? 'multi' : 'modern';

        const query = text ?? input;

        setLastUsedQueryAction(QUERY_ACTIONS.execute);
        setResultType(RESULT_TYPES.EXECUTE);
        sendExecuteQuery({
            query,
            database: tenantName,
            mode,
            schema,
        });
        setIsResultLoaded(true);
        props.setShowPreview(false);

        // Don't save partial queries in history
        if (!text) {
            const {queries, currentIndex} = history;
            if (query !== queries[currentIndex]?.queryText) {
                props.saveQueryToHistory(input, mode);
            }
        }
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    };

    const handleGetExplainQueryClick = (mode: QueryMode | undefined) => {
        const {input} = executeQuery;

        setLastUsedQueryAction(QUERY_ACTIONS.explain);
        setResultType(RESULT_TYPES.EXPLAIN);
        sendExplainQuery({
            query: input,
            database: tenantName,
            mode: mode,
        });
        setIsResultLoaded(true);
        props.setShowPreview(false);
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    };

    React.useEffect(() => {
        if (monacoHotKey === null) {
            return;
        }
        setMonacoHotKey(null);
        switch (monacoHotKey) {
            case MONACO_HOT_KEY_ACTIONS.sendQuery: {
                if (lastUsedQueryAction === QUERY_ACTIONS.explain) {
                    handleGetExplainQueryClick(queryMode);
                } else {
                    handleSendExecuteClick(queryMode);
                }
                break;
            }
            case MONACO_HOT_KEY_ACTIONS.sendSelectedQuery: {
                const selection = editorRef.current?.getSelection();
                const model = editorRef.current?.getModel();
                if (selection && model) {
                    const text = model.getValueInRange({
                        startLineNumber: selection.getSelectionStart().lineNumber,
                        startColumn: selection.getSelectionStart().column,
                        endLineNumber: selection.getPosition().lineNumber,
                        endColumn: selection.getPosition().column,
                    });
                    handleSendExecuteClick(queryMode, text);
                }
                break;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monacoHotKey]);

    const editorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
        const keybindings = getKeyBindings(monaco);
        editorRef.current = editor;
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
            run: () => setMonacoHotKey(MONACO_HOT_KEY_ACTIONS.sendQuery),
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
            run: () => setMonacoHotKey(MONACO_HOT_KEY_ACTIONS.sendSelectedQuery),
        });

        editor.addAction({
            id: 'previous-query',
            label: i18n('action.previous-query'),
            keybindings: [keybindings.selectPreviousQuery],
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 2,
            run: () => {
                props.goToPreviousQuery();
            },
        });
        editor.addAction({
            id: 'next-query',
            label: i18n('action.next-query'),
            keybindings: [keybindings.selectNextQuery],
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 3,
            run: () => {
                props.goToNextQuery();
            },
        });
        editor.addAction({
            id: 'save-query',
            label: i18n('action.save-query'),
            keybindings: [keybindings.saveQuery],
            run: () => {
                setQueryAction('save');
            },
        });
    };

    const onChange = (newValue: string) => {
        props.changeUserInput({input: newValue});
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

    const handleSaveQuery = (queryName: string | null) => {
        const {input} = executeQuery;
        saveQuery(queryName, input);
    };

    const renderControls = () => {
        return (
            <QueryEditorControls
                onRunButtonClick={handleSendExecuteClick}
                runIsLoading={executeQueryResult.isLoading}
                onExplainButtonClick={handleGetExplainQueryClick}
                explainIsLoading={explainQueryResult.isLoading}
                onSaveQueryClick={handleSaveQuery}
                disabled={!executeQuery.input}
                onUpdateQueryMode={setQueryMode}
                queryMode={queryMode}
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
                                language={LANGUAGE_YQL_ID}
                                value={executeQuery.input}
                                options={editorOptions}
                                onChange={onChange}
                                editorDidMount={editorDidMount}
                                theme={`vs-${theme}`}
                            />
                        </div>
                    </div>
                    {renderControls()}
                </div>
                <div className={b('pane-wrapper')}>
                    <Result
                        executeQueryData={executeQueryResult.data}
                        executeQueryError={executeQueryResult.error}
                        explainQueryData={explainQueryResult.data}
                        explainQueryError={explainQueryResult.error}
                        explainQueryLoading={explainQueryResult.isLoading}
                        resultVisibilityState={resultVisibilityState}
                        onExpandResultHandler={onExpandResultHandler}
                        onCollapseResultHandler={onCollapseResultHandler}
                        type={type}
                        theme={theme}
                        resultType={resultType}
                        tenantName={tenantName}
                        path={path}
                        showPreview={showPreview}
                    />
                </div>
            </SplitPane>
            <SaveQueryDialog onSaveQuery={handleSaveQuery} />
        </div>
    );
}

const mapStateToProps = (state: RootState) => {
    return {
        executeQuery: state.executeQuery,
        showPreview: state.schema.showPreview,
    };
};

const mapDispatchToProps = {
    saveQueryToHistory,
    goToPreviousQuery,
    goToNextQuery,
    setShowPreview,
    setTenantPath,
};

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);

interface ResultProps {
    executeQueryData?: IQueryResult;
    executeQueryError?: unknown;
    explainQueryData?: PreparedExplainResponse;
    explainQueryError?: unknown;
    explainQueryLoading?: boolean;
    resultVisibilityState: InitialPaneState;
    onExpandResultHandler: () => void;
    onCollapseResultHandler: () => void;
    type?: EPathType;
    theme: string;
    resultType: ValueOf<typeof RESULT_TYPES> | undefined;
    tenantName: string;
    path: string;
    showPreview?: boolean;
}
function Result({
    executeQueryData,
    executeQueryError,
    explainQueryData,
    explainQueryError,
    explainQueryLoading,
    resultVisibilityState,
    onExpandResultHandler,
    onCollapseResultHandler,
    type,
    theme,
    resultType,
    tenantName,
    path,
    showPreview,
}: ResultProps) {
    if (showPreview) {
        return <Preview database={tenantName} path={path} type={type} />;
    }

    if (resultType === RESULT_TYPES.EXECUTE) {
        if (executeQueryData || executeQueryError) {
            const {stats, ...data} = executeQueryData || {};

            return (
                <ExecuteResult
                    data={data}
                    stats={stats}
                    error={executeQueryError}
                    isResultsCollapsed={resultVisibilityState.collapsed}
                    onExpandResults={onExpandResultHandler}
                    onCollapseResults={onCollapseResultHandler}
                />
            );
        }

        return null;
    }

    if (resultType === RESULT_TYPES.EXPLAIN) {
        const {plan, ast} = explainQueryData || {};

        return (
            <ExplainResult
                error={explainQueryError}
                explain={plan}
                ast={ast}
                loading={explainQueryLoading}
                theme={theme}
                isResultsCollapsed={resultVisibilityState.collapsed}
                onExpandResults={onExpandResultHandler}
                onCollapseResults={onCollapseResultHandler}
            />
        );
    }

    return null;
}
