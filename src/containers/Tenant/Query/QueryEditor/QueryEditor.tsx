import React from 'react';

import throttle from 'lodash/throttle';
import type Monaco from 'monaco-editor';
import {connect} from 'react-redux';

import {MonacoEditor} from '../../../../components/MonacoEditor/MonacoEditor';
import SplitPane from '../../../../components/SplitPane';
import type {RootState} from '../../../../store';
import {
    goToNextQuery,
    goToPreviousQuery,
    saveQueryToHistory,
    sendExecuteQuery,
    setTenantPath,
} from '../../../../store/reducers/executeQuery';
import {getExplainQuery, getExplainQueryAst} from '../../../../store/reducers/explainQuery';
import {setShowPreview} from '../../../../store/reducers/schema/schema';
import type {EPathType} from '../../../../types/api/schema';
import type {ValueOf} from '../../../../types/common';
import type {ExecuteQueryState} from '../../../../types/store/executeQuery';
import type {ExplainQueryState} from '../../../../types/store/explainQuery';
import type {QueryAction, QueryMode, SavedQuery} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {
    DEFAULT_IS_QUERY_RESULT_COLLAPSED,
    DEFAULT_SIZE_RESULT_PANE_KEY,
    LAST_USED_QUERY_ACTION_KEY,
    QUERY_USE_MULTI_SCHEMA_KEY,
    SAVED_QUERIES_KEY,
} from '../../../../utils/constants';
import {useQueryModes, useSetting} from '../../../../utils/hooks';
import {LANGUAGE_YQL_ID} from '../../../../utils/monaco/yql/constants';
import {QUERY_ACTIONS} from '../../../../utils/query';
import {parseJson} from '../../../../utils/utils';
import type {InitialPaneState} from '../../utils/paneVisibilityToggleHelpers';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from '../../utils/paneVisibilityToggleHelpers';
import {ExecuteResult} from '../ExecuteResult/ExecuteResult';
import {ExplainResult} from '../ExplainResult/ExplainResult';
import {Preview} from '../Preview/Preview';
import {QueryEditorControls} from '../QueryEditorControls/QueryEditorControls';
import i18n from '../i18n';

import {useEditorOptions} from './helpers';

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
    path: string;
    sendExecuteQuery: (...args: Parameters<typeof sendExecuteQuery>) => void;
    getExplainQuery: (...args: Parameters<typeof getExplainQuery>) => void;
    getExplainQueryAst: (...args: Parameters<typeof getExplainQueryAst>) => void;
    changeUserInput: (arg: {input: string}) => void;
    goToNextQuery: (...args: Parameters<typeof goToNextQuery>) => void;
    goToPreviousQuery: (...args: Parameters<typeof goToPreviousQuery>) => void;
    setTenantPath: (...args: Parameters<typeof setTenantPath>) => void;
    executeQuery: ExecuteQueryState;
    explainQuery: ExplainQueryState;
    theme: string;
    type?: EPathType;
    showPreview: boolean;
    setShowPreview: (...args: Parameters<typeof setShowPreview>) => void;
    saveQueryToHistory: (...args: Parameters<typeof saveQueryToHistory>) => void;
}

function QueryEditor(props: QueryEditorProps) {
    const editorOptions = useEditorOptions();
    const {
        path,
        setTenantPath: setPath,
        executeQuery,
        explainQuery,
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
    const [savedQueries, setSavedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY);
    const [monacoHotKey, setMonacoHotKey] = React.useState<ValueOf<
        typeof MONACO_HOT_KEY_ACTIONS
    > | null>(null);

    React.useEffect(() => {
        if (savedPath !== path) {
            if (savedPath) {
                changeUserInput({input: ''});
            }
            setPath(path);
        }
    }, [changeUserInput, setPath, path, savedPath]);

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
        const storageEventHandler = (event: StorageEvent) => {
            if (event.key === SAVED_QUERIES_KEY) {
                const v = parseJson(event.newValue);
                setSavedQueries(v);
            }
        };

        window.addEventListener('storage', storageEventHandler);
        return () => {
            window.removeEventListener('storage', storageEventHandler);
        };
    }, [setSavedQueries]);

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
        props.sendExecuteQuery({
            query,
            database: path,
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
        props.getExplainQuery({
            query: input,
            database: path,
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
        editorRef.current = editor;
        editor.focus();
        editor.addAction({
            id: 'sendQuery',
            label: i18n('action.send-query'),
            keybindings: [
                // eslint-disable-next-line no-bitwise
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            ],
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
            keybindings: [
                // eslint-disable-next-line no-bitwise
                monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
            ],
            precondition: 'canSendSelectedText',
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 1,
            run: () => setMonacoHotKey(MONACO_HOT_KEY_ACTIONS.sendSelectedQuery),
        });

        editor.addAction({
            id: 'previous-query',
            label: i18n('action.previous-query'),
            keybindings: [
                // eslint-disable-next-line no-bitwise
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow,
            ],
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 2,
            run: () => {
                props.goToPreviousQuery();
            },
        });
        editor.addAction({
            id: 'next-query',
            label: i18n('action.next-query'),
            keybindings: [
                // eslint-disable-next-line no-bitwise
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow,
            ],
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 3,
            run: () => {
                props.goToNextQuery();
            },
        });
    };

    const onChange = (newValue: string) => {
        props.changeUserInput({input: newValue});
    };

    const handleAstQuery = () => {
        props.getExplainQueryAst({query: executeQuery.input, database: path});
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

    const onSaveQueryHandler = (queryName: string) => {
        const {input} = executeQuery;

        const queryIndex = savedQueries.findIndex(
            (el) => el.name.toLowerCase() === queryName.toLowerCase(),
        );
        const newSavedQueries = [...savedQueries];
        const newQuery = {name: queryName, body: input};
        if (queryIndex === -1) {
            newSavedQueries.push(newQuery);
        } else {
            newSavedQueries[queryIndex] = newQuery;
        }

        setSavedQueries(newSavedQueries);
    };

    const renderControls = () => {
        return (
            <QueryEditorControls
                onRunButtonClick={handleSendExecuteClick}
                runIsLoading={executeQuery.loading}
                onExplainButtonClick={handleGetExplainQueryClick}
                explainIsLoading={explainQuery.loading}
                onSaveQueryClick={onSaveQueryHandler}
                savedQueries={savedQueries}
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
                        executeQuery={executeQuery}
                        explainQuery={explainQuery}
                        resultVisibilityState={resultVisibilityState}
                        onExpandResultHandler={onExpandResultHandler}
                        onCollapseResultHandler={onCollapseResultHandler}
                        type={type}
                        handleAstQuery={handleAstQuery}
                        theme={theme}
                        resultType={resultType}
                        path={path}
                        showPreview={showPreview}
                    />
                </div>
            </SplitPane>
        </div>
    );
}

const mapStateToProps = (state: RootState) => {
    return {
        executeQuery: state.executeQuery,
        explainQuery: state.explainQuery,
        showPreview: state.schema.showPreview,
    };
};

const mapDispatchToProps = {
    sendExecuteQuery,
    saveQueryToHistory,
    goToPreviousQuery,
    goToNextQuery,
    getExplainQuery,
    getExplainQueryAst,
    setShowPreview,
    setTenantPath,
};

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);

interface ResultProps {
    executeQuery: ExecuteQueryState;
    explainQuery: ExplainQueryState;
    resultVisibilityState: InitialPaneState;
    onExpandResultHandler: () => void;
    onCollapseResultHandler: () => void;
    type?: EPathType;
    handleAstQuery: () => void;
    theme: string;
    resultType: ValueOf<typeof RESULT_TYPES> | undefined;
    path: string;
    showPreview?: boolean;
}
function Result({
    executeQuery,
    explainQuery,
    resultVisibilityState,
    onExpandResultHandler,
    onCollapseResultHandler,
    type,
    handleAstQuery,
    theme,
    resultType,
    path,
    showPreview,
}: ResultProps) {
    if (showPreview) {
        return <Preview database={path} type={type} />;
    }

    if (resultType === RESULT_TYPES.EXECUTE) {
        const {data, error, stats} = executeQuery;
        return data || error ? (
            <ExecuteResult
                data={data}
                stats={stats}
                error={error}
                isResultsCollapsed={resultVisibilityState.collapsed}
                onExpandResults={onExpandResultHandler}
                onCollapseResults={onCollapseResultHandler}
            />
        ) : null;
    }

    if (resultType === RESULT_TYPES.EXPLAIN) {
        const {data, dataAst, error, loading, loadingAst} = explainQuery;

        return (
            <ExplainResult
                error={error}
                explain={data}
                astQuery={handleAstQuery}
                ast={dataAst}
                loading={loading}
                loadingAst={loadingAst}
                theme={theme}
                isResultsCollapsed={resultVisibilityState.collapsed}
                onExpandResults={onExpandResultHandler}
                onCollapseResults={onCollapseResultHandler}
            />
        );
    }

    return null;
}
