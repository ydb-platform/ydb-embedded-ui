import {useEffect, useReducer, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import _ from 'lodash';
import MonacoEditor from 'react-monaco-editor';

import SplitPane from '../../../../components/SplitPane';

import {
    sendExecuteQuery,
    saveQueryToHistory,
    goToPreviousQuery,
    goToNextQuery,
    MONACO_HOT_KEY_ACTIONS,
    setMonacoHotKey,
    setTenantPath,
} from '../../../../store/reducers/executeQuery';
import {getExplainQuery, getExplainQueryAst} from '../../../../store/reducers/explainQuery';
import {getParsedSettingValue, setSettingValue} from '../../../../store/reducers/settings/settings';
import {setShowPreview} from '../../../../store/reducers/schema/schema';
import {
    DEFAULT_IS_QUERY_RESULT_COLLAPSED,
    DEFAULT_SIZE_RESULT_PANE_KEY,
    SAVED_QUERIES_KEY,
    ENABLE_ADDITIONAL_QUERY_MODES,
    LAST_USED_QUERY_ACTION_KEY,
    QUERY_USE_MULTI_SCHEMA_KEY,
} from '../../../../utils/constants';
import {useSetting, useQueryModes} from '../../../../utils/hooks';
import {QUERY_ACTIONS, QUERY_MODES, isNewQueryMode} from '../../../../utils/query';

import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from '../../utils/paneVisibilityToggleHelpers';
import {Preview} from '../Preview/Preview';

import {ExecuteResult} from '../ExecuteResult/ExecuteResult';
import {ExplainResult} from '../ExplainResult/ExplainResult';
import {QueryEditorControls} from '../QueryEditorControls/QueryEditorControls';

import './QueryEditor.scss';

const EDITOR_OPTIONS = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    minimap: {
        enabled: false,
    },
};

const CONTEXT_MENU_GROUP_ID = 'navigation';
const RESULT_TYPES = {
    EXECUTE: 'execute',
    EXPLAIN: 'explain',
};

const b = cn('query-editor');

const propTypes = {
    sendExecuteQuery: PropTypes.func,
    changeUserInput: PropTypes.func,
    path: PropTypes.string,
    response: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
    executeQuery: PropTypes.object,
    explainQuery: PropTypes.object,
    setMonacoHotKey: PropTypes.func,
    theme: PropTypes.string,
    type: PropTypes.string,
    initialQueryMode: PropTypes.string,
    setTenantPath: PropTypes.func,
};

const initialTenantCommonInfoState = {
    triggerExpand: false,
    triggerCollapse: false,
    collapsed: true,
};
function QueryEditor(props) {
    const {path, executeQuery, theme, setTenantPath, changeUserInput} = props;
    const {tenantPath: savedPath} = executeQuery;

    const [resultType, setResultType] = useState(RESULT_TYPES.EXECUTE);

    const [isResultLoaded, setIsResultLoaded] = useState(false);
    const [queryMode, setQueryMode] = useQueryModes();
    const [enableAdditionalQueryModes] = useSetting(ENABLE_ADDITIONAL_QUERY_MODES);
    const [useMultiSchema] = useSetting(QUERY_USE_MULTI_SCHEMA_KEY);
    const [lastUsedQueryAction, setLastUsedQueryAction] = useSetting(LAST_USED_QUERY_ACTION_KEY);

    useEffect(() => {
        if (isNewQueryMode(queryMode) && !enableAdditionalQueryModes) {
            setQueryMode(QUERY_MODES.script);
        }
    }, [enableAdditionalQueryModes, queryMode, setQueryMode]);

    useEffect(() => {
        if (savedPath !== path) {
            if (savedPath) {
                changeUserInput({input: ''});
            }
            setTenantPath(path);
        }
    }, [changeUserInput, setTenantPath, path, savedPath]);

    const [resultVisibilityState, dispatchResultVisibilityState] = useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_QUERY_RESULT_COLLAPSED),
        initialTenantCommonInfoState,
    );

    const editorRef = useRef(null);

    useEffect(() => {
        updateEditor();

        window.addEventListener('resize', onChangeWindow);
        window.addEventListener('storage', storageEventHandler);

        return () => {
            window.removeEventListener('resize', onChangeWindow);
            window.removeEventListener('storage', storageEventHandler);
            window.onbeforeunload = undefined;
            props.setMonacoHotKey(null);
        };
    }, []);

    useEffect(() => {
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
    }, []);

    useEffect(() => {
        if (props.showPreview || isResultLoaded) {
            dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
        } else {
            dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
        }
    }, [props.showPreview, isResultLoaded]);

    useEffect(() => {
        const {
            explainQuery: {data},
            executeQuery: {input, history},
        } = props;

        const hasUnsavedInput = input
            ? input !== history.queries[history.queries?.length - 1]
            : false;

        if (hasUnsavedInput) {
            window.onbeforeunload = checkIfHasUnsavedInput;
        } else {
            window.onbeforeunload = undefined;
        }

        if (!data || resultType !== RESULT_TYPES.EXPLAIN) {
            return;
        }
    }, [props.executeQuery, props.executeQuery]);

    useEffect(() => {
        const {monacoHotKey, setMonacoHotKey} = props;
        if (monacoHotKey === null) {
            return;
        }
        setMonacoHotKey(null);
        switch (monacoHotKey) {
            case MONACO_HOT_KEY_ACTIONS.sendQuery: {
                if (lastUsedQueryAction === QUERY_ACTIONS.explain) {
                    return handleGetExplainQueryClick(queryMode);
                } else {
                    return handleSendExecuteClick(queryMode);
                }
            }
            case MONACO_HOT_KEY_ACTIONS.goPrev: {
                return handlePreviousHistoryClick();
            }
            case MONACO_HOT_KEY_ACTIONS.goNext: {
                return handleNextHistoryClick();
            }
            default: {
                return;
            }
        }
    }, [props.monacoHotKey]);

    const checkIfHasUnsavedInput = (e) => {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
    };

    const handleKeyBinding = (value) => {
        return () => props.setMonacoHotKey(value);
    };

    const editorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        editor.focus();
        editor.addAction({
            id: 'sendQuery',
            label: 'Send query',
            keybindings: [
                // eslint-disable-next-line no-bitwise
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            ],
            // A precondition for this action.
            precondition: null,
            // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
            keybindingContext: null,
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 1,
            // Method that will be executed when the action is triggered.
            // @param editor The editor instance is passed in as a convinience
            run: handleKeyBinding(MONACO_HOT_KEY_ACTIONS.sendQuery),
        });

        editor.addAction({
            id: 'previous-query',
            label: 'Previous query',
            keybindings: [
                // eslint-disable-next-line no-bitwise
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow,
            ],
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 2,
            run: handleKeyBinding(MONACO_HOT_KEY_ACTIONS.goPrev),
        });
        editor.addAction({
            id: 'next-query',
            label: 'Next query',
            keybindings: [
                // eslint-disable-next-line no-bitwise
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow,
            ],
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 3,
            run: handleKeyBinding(MONACO_HOT_KEY_ACTIONS.goNext),
        });
    };
    const onChange = (newValue) => {
        props.changeUserInput({input: newValue});
    };

    const handleSendExecuteClick = (mode) => {
        const {
            path,
            executeQuery: {input, history},
            sendExecuteQuery,
            saveQueryToHistory,
            setShowPreview,
        } = props;

        const schema = useMultiSchema ? 'multi' : 'modern';

        setLastUsedQueryAction(QUERY_ACTIONS.execute);
        setResultType(RESULT_TYPES.EXECUTE);
        sendExecuteQuery({
            query: input,
            database: path,
            mode,
            schema,
        });
        setIsResultLoaded(true);
        setShowPreview(false);

        const {queries, currentIndex} = history;
        if (input !== queries[currentIndex]) {
            saveQueryToHistory(input, mode);
        }
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    };

    const handleGetExplainQueryClick = (mode) => {
        const {
            path,
            executeQuery: {input},
            getExplainQuery,
            setShowPreview,
        } = props;

        setLastUsedQueryAction(QUERY_ACTIONS.explain);
        setResultType(RESULT_TYPES.EXPLAIN);
        getExplainQuery({
            query: input,
            database: path,
            mode: mode,
        });
        setIsResultLoaded(true);
        setShowPreview(false);
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    };

    const handleAstQuery = () => {
        const {
            path,
            executeQuery: {input},
            getExplainQueryAst,
        } = props;
        getExplainQueryAst({query: input, database: path});
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

    const renderExecuteQuery = () => {
        const {
            executeQuery: {data, error, stats},
        } = props;

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
    };

    const renderExplainQuery = () => {
        const {
            explainQuery: {data, dataAst, error, loading, loadingAst},
            theme,
        } = props;

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
    };

    const renderResult = () => {
        let result;
        switch (resultType) {
            case RESULT_TYPES.EXECUTE:
                result = renderExecuteQuery();
                break;
            case RESULT_TYPES.EXPLAIN:
                result = renderExplainQuery();
                break;
            default:
                result = null;
        }

        return result;
    };

    const renderPreview = () => {
        const {path, type} = props;
        return <Preview database={path} type={type} />;
    };

    const handlePreviousHistoryClick = () => {
        const {
            changeUserInput,
            executeQuery: {history},
            goToPreviousQuery,
        } = props;
        const {queries, currentIndex} = history;

        if (previousButtonIsDisabled()) {
            return;
        }

        goToPreviousQuery();
        changeUserInput({input: queries[currentIndex - 1]});
    };

    const handleNextHistoryClick = () => {
        const {
            changeUserInput,
            executeQuery: {history},
            goToNextQuery,
        } = props;
        const {queries, currentIndex} = history;

        if (nextButtonIsDisabled()) {
            return;
        }

        goToNextQuery();
        changeUserInput({input: queries[currentIndex + 1]});
    };

    const previousButtonIsDisabled = () => {
        const {
            history: {currentIndex},
        } = props.executeQuery;

        return currentIndex <= 0;
    };

    const nextButtonIsDisabled = () => {
        const {
            history: {queries, currentIndex},
        } = props.executeQuery;

        return queries.length - 1 === currentIndex;
    };

    const onChangeWindow = _.throttle(() => {
        updateEditor();
    }, 100);

    const storageEventHandler = (event) => {
        if (event.key === SAVED_QUERIES_KEY) {
            props.setSettingValue(SAVED_QUERIES_KEY, event.newValue);
        }
    };

    const updateEditor = () => {
        if (editorRef.current) {
            editorRef.current.layout();
        }
    };

    const onSaveQueryHandler = (queryName) => {
        const {
            executeQuery: {input},
            savedQueries = [],
            setSettingValue,
        } = props;

        const queryIndex = savedQueries.findIndex(
            (el) => el.name.toLowerCase() === queryName.toLowerCase(),
        );
        const newSavedQueries = [...savedQueries];
        const newQuery = {name: queryName, body: input};
        if (queryIndex !== -1) {
            newSavedQueries[queryIndex] = newQuery;
        } else {
            newSavedQueries.push(newQuery);
        }

        setSettingValue(SAVED_QUERIES_KEY, JSON.stringify(newSavedQueries));
    };

    const renderControls = () => {
        const {executeQuery, explainQuery, savedQueries} = props;

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
                enableAdditionalQueryModes={enableAdditionalQueryModes}
                highlitedAction={lastUsedQueryAction}
            />
        );
    };

    const result = renderResult();

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
                                language="sql"
                                value={executeQuery.input}
                                options={EDITOR_OPTIONS}
                                onChange={onChange}
                                editorDidMount={editorDidMount}
                                theme={`vs-${theme}`}
                            />
                        </div>
                    </div>
                    {renderControls()}
                </div>
                <div className={b('pane-wrapper')}>
                    {props.showPreview ? renderPreview() : result}
                </div>
            </SplitPane>
        </div>
    );
}

const mapStateToProps = (state) => {
    return {
        executeQuery: state.executeQuery,
        explainQuery: state.explainQuery,
        savedQueries: getParsedSettingValue(state, SAVED_QUERIES_KEY),
        showPreview: state.schema.showPreview,
        currentSchema: state.schema.currentSchema,
        monacoHotKey: state.executeQuery?.monacoHotKey,
    };
};

const mapDispatchToProps = {
    sendExecuteQuery,
    saveQueryToHistory,
    goToPreviousQuery,
    goToNextQuery,
    getExplainQuery,
    getExplainQueryAst,
    setSettingValue,
    setShowPreview,
    setMonacoHotKey,
    setTenantPath,
};

QueryEditor.propTypes = propTypes;

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
