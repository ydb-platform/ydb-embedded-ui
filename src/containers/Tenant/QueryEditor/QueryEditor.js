import {useEffect, useReducer, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import _ from 'lodash';
import MonacoEditor from 'react-monaco-editor';
import DataTable from '@yandex-cloud/react-data-table';
import {Button, DropdownMenu} from '@yandex-cloud/uikit';
import SplitPane from '../../../components/SplitPane';

import SaveQuery from './SaveQuery/SaveQuery';
import SavedQueries from './SavedQueries/SavedQueries';
import Icon from '../../../components/Icon/Icon';
import QueryResult from './QueryResult/QueryResult';
import QueryExplain from './QueryExplain/QueryExplain';

import {
    sendQuery,
    changeUserInput,
    saveQueryToHistory,
    goToPreviousQuery,
    goToNextQuery,
    selectRunAction,
    RUN_ACTIONS_VALUES,
    MONACO_HOT_KEY_ACTIONS,
    setMonacoHotKey,
} from '../../../store/reducers/executeQuery';
import {getExplainQuery, getExplainQueryAst} from '../../../store/reducers/explainQuery';
import {showTooltip} from '../../../store/reducers/tooltip';
import {getSettingValue, setSettingValue} from '../../../store/reducers/settings';
import {
    DEFAULT_IS_QUERY_RESULT_COLLAPSED,
    DEFAULT_SIZE_RESULT_PANE_KEY,
    DEFAULT_TABLE_SETTINGS,
    SAVED_QUERIES_KEY,
    QUERY_INITIAL_RUN_ACTION_KEY,
} from '../../../utils/constants';
import {prepareQueryResponse} from '../../../utils/index';

import {parseJson} from '../../../utils/utils';

import './QueryEditor.scss';
import Divider from '../../../components/Divider/Divider';
import QueriesHistory from './QueriesHistory/QueriesHistory';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from '../utils/paneVisibilityToggleHelpers';
import Preview from '../Preview/Preview';
import {setShowPreview} from '../../../store/reducers/schema';

export const RUN_ACTIONS = [
    {value: RUN_ACTIONS_VALUES.script, content: 'Run Script'},
    {value: RUN_ACTIONS_VALUES.scan, content: 'Run Scan'},
];

const TABLE_SETTINGS = {
    ...DEFAULT_TABLE_SETTINGS,
    sortable: false,
    dynamicItemSizeGetter: () => 40,
    dynamicRenderType: 'variable',
    stripedRows: true,
};

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
    sendQuery: PropTypes.func,
    path: PropTypes.string,
    response: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
    executeQuery: PropTypes.object,
    explainQuery: PropTypes.object,
    showTooltip: PropTypes.func,
    setMonacoHotKey: PropTypes.func,
    theme: PropTypes.string,
    type: PropTypes.string,
};

const initialTenantCommonInfoState = {
    triggerExpand: false,
    triggerCollapse: false,
    collapsed: true,
};
function QueryEditor(props) {
    const [resultType, setResultType] = useState(RESULT_TYPES.EXECUTE);

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
        const {showPreview} = props;
        if (showPreview && resultVisibilityState.collapsed) {
            dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
        }
    }, [props.showPreview, resultVisibilityState.collapsed]);

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
                return handleSendClick();
            }
            case MONACO_HOT_KEY_ACTIONS.goPrev: {
                return handlePreviousHistoryClick();
            }
            case MONACO_HOT_KEY_ACTIONS.goNext: {
                return handleNextHistoryClick();
            }
            case MONACO_HOT_KEY_ACTIONS.getExplain: {
                return handleGetExplainQueryClick();
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
            id: 'run',
            label: 'Run',
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

        editor.addAction({
            id: 'explain',
            label: 'Explain',
            keybindings: [
                // eslint-disable-next-line no-bitwise
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_E,
            ],
            // A precondition for this action.
            precondition: null,
            // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
            keybindingContext: null,
            contextMenuGroupId: CONTEXT_MENU_GROUP_ID,
            contextMenuOrder: 4,
            run: handleKeyBinding(MONACO_HOT_KEY_ACTIONS.getExplain),
        });
    };
    const onChange = (newValue) => {
        props.changeUserInput({input: newValue});
    };

    const handleSendClick = () => {
        const {
            path,
            executeQuery: {input, history, runAction},
            sendQuery,
            saveQueryToHistory,
            setShowPreview,
        } = props;

        setResultType(RESULT_TYPES.EXECUTE);
        sendQuery({query: input, database: path, action: runAction});
        setShowPreview(false);

        const {queries, currentIndex} = history;
        if (input !== queries[currentIndex]) {
            saveQueryToHistory(input);
        }
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    };

    const handleGetExplainQueryClick = () => {
        const {
            path,
            executeQuery: {input},
            getExplainQuery,
            setShowPreview,
        } = props;
        setResultType(RESULT_TYPES.EXPLAIN);
        getExplainQuery({query: input, database: path});
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
            showTooltip,
        } = props;

        let content;
        if (data) {
            let columns = [];
            if (data.length > 0) {
                columns = Object.keys(data[0]).map((key) => ({
                    name: key,
                    render: ({value}) => {
                        return (
                            <span
                                className={b('cell')}
                                onClick={(e) => showTooltip(e.target, value, 'cell')}
                            >
                                {value}
                            </span>
                        );
                    },
                }));
                const preparedData = prepareQueryResponse(data);

                content = columns.length ? (
                    <DataTable
                        columns={columns}
                        data={preparedData}
                        settings={TABLE_SETTINGS}
                        theme="yandex-cloud"
                        rowKey={(_, index) => index}
                    />
                ) : (
                    <div>{data}</div>
                );
            }
        }
        const textResults = getPreparedResult();
        const disabled = !textResults.length || resultType !== RESULT_TYPES.EXECUTE;

        return data || error ? (
            <QueryResult
                result={content}
                stats={stats}
                error={error}
                textResults={textResults}
                copyDisabled={disabled}
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
            <QueryExplain
                error={error}
                explain={data}
                astQuery={handleAstQuery}
                ast={dataAst?.ast}
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
        const {path, type, currentSchema = {}} = props;
        const partCount = currentSchema?.PathDescription?.TableStats?.PartCount;
        // onExpandResultHandler();
        return (
            <Preview database={path} table={currentSchema.Path} type={type} partCount={partCount} />
        );
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

    const renderHistoryNavigation = () => {
        const {changeUserInput} = props;
        return (
            <div className={b('history-controls')}>
                <QueriesHistory changeUserInput={changeUserInput} />
            </div>
        );
    };

    const getPreparedResult = () => {
        const {
            executeQuery: {data},
        } = props;
        const columnDivider = '\t';
        const rowDivider = '\n';

        if (!data?.length) {
            return '';
        }

        const columnHeaders = Object.keys(data[0]);
        const rows = [columnHeaders].concat(data);

        return rows
            .map((item) => {
                const row = [];

                for (const field in item) {
                    if (typeof item[field] === 'object' || Array.isArray(item[field])) {
                        row.push(JSON.stringify(item[field]));
                    } else {
                        row.push(item[field]);
                    }
                }

                return row.join(columnDivider);
            })
            .join(rowDivider);
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

    const onDeleteQueryHandler = (queryName) => {
        const {savedQueries = [], setSettingValue} = props;
        const newSavedQueries = savedQueries.filter(
            (el) => el.name.toLowerCase() !== queryName.toLowerCase(),
        );
        setSettingValue(SAVED_QUERIES_KEY, JSON.stringify(newSavedQueries));
    };

    const renderControls = () => {
        const {
            executeQuery,
            explainQuery,
            savedQueries,
            selectRunAction,
            setSettingValue,
        } = props;
        const {runAction} = executeQuery;
        const runIsDisabled = !executeQuery.input || executeQuery.loading;
        const runText = _.find(RUN_ACTIONS, {value: runAction}).content;

        const menuItems = RUN_ACTIONS.map((action) => {
            return {
                text: action.content,
                action: () => {
                    selectRunAction(action.value);
                    setSettingValue(QUERY_INITIAL_RUN_ACTION_KEY, action.value);
                },
            };
        });

        return (
            <div className={b('controls')}>
                <div className={b('control-run')}>
                    <Button
                        onClick={handleSendClick}
                        view="action"
                        pin="round-brick"
                        disabled={runIsDisabled}
                        loading={executeQuery.loading}
                    >
                        <Icon name="startPlay" viewBox="0 0 16 16" width={16} height={16} />
                        {runText}
                    </Button>
                    <DropdownMenu
                        items={menuItems}
                        switcher={
                            <Button
                                view="action"
                                pin="brick-round"
                                disabled={runIsDisabled}
                                loading={executeQuery.loading}
                                className={b('select-query-action')}
                            >
                                <Icon name="chevron-down" width={16} height={16} />
                            </Button>
                        }
                    />
                </div>
                <Button
                    onClick={handleGetExplainQueryClick}
                    disabled={!executeQuery.input}
                    loading={explainQuery.loading}
                >
                    Explain
                </Button>
                <Divider />
                <SaveQuery
                    savedQueries={savedQueries}
                    onSaveQuery={onSaveQueryHandler}
                    saveButtonDisabled={runIsDisabled}
                />
            </div>
        );
    };

    const renderUpperControls = () => {
        const {savedQueries, changeUserInput} = props;

        return (
            <div className={b('upper-controls')}>
                {renderHistoryNavigation()}
                <SavedQueries
                    savedQueries={savedQueries}
                    changeUserInput={changeUserInput}
                    onDeleteQuery={onDeleteQueryHandler}
                />
            </div>
        );
    };

    const {executeQuery, theme} = props;
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
                <div className={b('pane-wrapper')}>
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
                    {renderUpperControls()}
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
        savedQueries: parseJson(getSettingValue(state, SAVED_QUERIES_KEY)),
        showPreview: state.schema.showPreview,
        currentSchema: state.schema.currentSchema,
        monacoHotKey: state.executeQuery?.monacoHotKey,
    };
};

const mapDispatchToProps = {
    sendQuery,
    changeUserInput,
    saveQueryToHistory,
    goToPreviousQuery,
    goToNextQuery,
    showTooltip,
    getExplainQuery,
    getExplainQueryAst,
    setSettingValue,
    selectRunAction,
    setShowPreview,
    setMonacoHotKey,
};

QueryEditor.propTypes = propTypes;

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
