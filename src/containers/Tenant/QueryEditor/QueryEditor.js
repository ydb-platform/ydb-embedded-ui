import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import _ from 'lodash';
import MonacoEditor from 'react-monaco-editor';
import DataTable from '@yandex-cloud/react-data-table';
import {Button, Toaster, CopyToClipboard} from '@yandex-cloud/uikit';
import {Select} from '@yandex-cloud/uikit/build/esm/components/unstable/Select';
import SplitPane from '../../../components/SplitPane';

import Pagination from '../../../components/Pagination/Pagination';
import SaveQuery from './SaveQuery/SaveQuery';
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
} from '../../../store/reducers/executeQuery';
import {getExplainQuery, getExplainQueryAst} from '../../../store/reducers/explainQuery';
import {showTooltip} from '../../../store/reducers/tooltip';
import {getSettingValue, setSettingValue} from '../../../store/reducers/settings';
import {THEME_KEY, DEFAULT_SIZE_RESULT_PANE_KEY, SAVED_QUERIES_KEY} from '../../../utils/constants';
import {prepareQueryResponse} from '../../../utils/index';

import {parseJson} from '../../../utils/utils';

import './QueryEditor.scss';

const toaster = new Toaster();

export const RUN_ACTIONS = [
    {value: RUN_ACTIONS_VALUES.script, content: 'Run Script'},
    {value: RUN_ACTIONS_VALUES.scan, content: 'Run Scan'},
];

const TABLE_SETTINGS = {
    displayIndices: false,
    syncHeadOnResize: true,
    stickyHead: DataTable.MOVING,
    sortable: false,
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

class QueryEditor extends React.Component {
    static propTypes = {
        sendQuery: PropTypes.func,
        path: PropTypes.string,
        response: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
        executeQuery: PropTypes.object,
        explainQuery: PropTypes.object,
        showTooltip: PropTypes.func,
        theme: PropTypes.string,
    };

    state = {
        resultType: RESULT_TYPES.EXECUTE,
        runAction: RUN_ACTIONS[0].value,
    };

    editorRef = null;

    componentDidMount() {
        this.updateEditor();

        window.addEventListener('resize', this.onChangeWindow);
        window.addEventListener('storage', this.storageEventHandler);
    }

    checkIfHasUnsavedInput(e) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onChangeWindow);
        window.removeEventListener('storage', this.storageEventHandler);
        window.onbeforeunload = undefined;
    }

    componentDidUpdate() {
        const {
            explainQuery: {data},
            executeQuery: {input, history},
        } = this.props;

        const hasUnsavedInput = input
            ? input !== history.queries[history.queries?.length - 1]
            : false;

        if (hasUnsavedInput) {
            window.onbeforeunload = this.checkIfHasUnsavedInput;
        } else {
            window.onbeforeunload = undefined;
        }

        if (!data || this.state.resultType !== RESULT_TYPES.EXPLAIN) {
            return;
        }
    }

    editorDidMount = (editor, monaco) => {
        this.editorRef = editor;
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
            run: () => {
                this.handleSendClick();
            },
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
            run: () => {
                this.handlePreviousHistoryClick();
            },
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
            run: () => {
                this.handleNextHistoryClick();
            },
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
            run: () => {
                this.handleGetExplainQueryClick();
            },
        });
    };
    onChange = (newValue) => {
        this.props.changeUserInput({input: newValue});
    };

    handleSendClick = () => {
        const {
            path,
            executeQuery: {input, history, runAction},
            sendQuery,
            saveQueryToHistory,
        } = this.props;

        this.setState({resultType: RESULT_TYPES.EXECUTE});
        sendQuery({query: input, database: path, action: runAction});

        const {queries, currentIndex} = history;
        if (input !== queries[currentIndex]) {
            saveQueryToHistory(input);
        }
    };

    handleCancelClick = () => {
        this.props.cancelQuery();
    };

    handleGetExplainQueryClick = () => {
        const {
            path,
            executeQuery: {input},
            getExplainQuery,
        } = this.props;

        this.setState({resultType: RESULT_TYPES.EXPLAIN}, () => {
            getExplainQuery({query: input, database: path});
        });
    };

    handleAstQuery = () => {
        const {
            path,
            executeQuery: {input},
            getExplainQueryAst,
        } = this.props;
        getExplainQueryAst({query: input, database: path});
    };

    renderExecuteQuery = () => {
        const {
            executeQuery: {data, error, stats},
            showTooltip,
        } = this.props;
        const result = this.getExecuteResult();
        const shouldRenderAnswer = result.length || error;

        if (!shouldRenderAnswer) {
            return null;
        }

        let columns = [];
        if (data && data.length > 0) {
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
        }

        const preparedData = prepareQueryResponse(data);
        const content = columns.length ? (
            <DataTable
                columns={columns}
                data={preparedData}
                settings={TABLE_SETTINGS}
                theme="common"
            />
        ) : (
            <div>{result}</div>
        );
        return <QueryResult result={content} stats={stats} />;
    };

    renderExplainQuery = () => {
        const {
            explainQuery: {data, dataAst, error, loading, loadingAst},
            theme,
        } = this.props;

        if (error) {
            return error.data ? error.data : error;
        } else if (!data && !loading) {
            return 'Explain of query is empty';
        } else if (!data) {
            return null;
        } else if (!data.nodes.length) {
            return 'There is no explanation for the request';
        }

        return (
            <QueryExplain
                explain={data}
                astQuery={this.handleAstQuery}
                ast={dataAst?.ast}
                loadingAst={loadingAst}
                theme={theme}
            />
        );
    };

    renderResult = () => {
        const {resultType} = this.state;

        let result;
        switch (resultType) {
            case RESULT_TYPES.EXECUTE:
                result = this.renderExecuteQuery();
                break;
            case RESULT_TYPES.EXPLAIN:
                result = this.renderExplainQuery();
                break;
            default:
                result = null;
        }

        return result;
    };

    handlePreviousHistoryClick = () => {
        const {
            changeUserInput,
            executeQuery: {history},
            goToPreviousQuery,
        } = this.props;
        const {queries, currentIndex} = history;

        if (this.previousButtonIsDisabled()) {
            return;
        }

        goToPreviousQuery();
        changeUserInput({input: queries[currentIndex - 1]});
    };

    handleNextHistoryClick = () => {
        const {
            changeUserInput,
            executeQuery: {history},
            goToNextQuery,
        } = this.props;
        const {queries, currentIndex} = history;

        if (this.nextButtonIsDisabled()) {
            return;
        }

        goToNextQuery();
        changeUserInput({input: queries[currentIndex + 1]});
    };

    previousButtonIsDisabled = () => {
        const {
            history: {currentIndex},
        } = this.props.executeQuery;

        return currentIndex <= 0;
    };

    nextButtonIsDisabled = () => {
        const {
            history: {queries, currentIndex},
        } = this.props.executeQuery;

        return queries.length - 1 === currentIndex;
    };

    renderHistoryNavigation = () => {
        return (
            <div className={b('history-controls')}>
                <span className={b('history-label')}>History:</span>
                <Pagination
                    previous={{
                        handler: this.handlePreviousHistoryClick,
                        hotkeyHandler: this.handlePreviousHistoryClick,
                        hotkeyScope: 'all',
                        hotkey: 'ctrl+up, command+up',
                        tooltip: 'Previous query [ctrl+↑]',
                        disabled: this.previousButtonIsDisabled(),
                    }}
                    next={{
                        handler: this.handleNextHistoryClick,
                        hotkeyHandler: this.handleNextHistoryClick,
                        hotkeyScope: 'all',
                        hotkey: 'ctrl+down, command+down',
                        tooltip: 'Next query [ctrl+↓]',
                        disabled: this.nextButtonIsDisabled(),
                    }}
                />
            </div>
        );
    };

    getExecuteResult = () => {
        const {
            data = [],
            error,
            loading,
            history: {queries},
        } = this.props.executeQuery;

        if (error) {
            return error.data || error;
        } else if (data.length > 0) {
            return data;
        } else if (!loading && queries.length) {
            return 'The request was successful';
        } else {
            return '';
        }
    };

    getPreparedResult = () => {
        const {
            executeQuery: {data},
        } = this.props;
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

    renderClipboardButton = () => {
        const results = this.getPreparedResult();
        const {resultType} = this.state;
        const disabled = !results.length || resultType !== RESULT_TYPES.EXECUTE;

        return (
            <CopyToClipboard text={results} timeout={1000}>
                {(state) => {
                    if (state === 'success') {
                        toaster.createToast({
                            name: 'Copied',
                            title: 'Results were copied to clipboard successfully',
                            type: state,
                        });
                    }

                    return (
                        <Button onClick={() => {}} disabled={disabled}>
                            Copy results
                        </Button>
                    );
                }}
            </CopyToClipboard>
        );
    };

    onChangeWindow = _.throttle(() => {
        this.updateEditor();
    }, 100);

    storageEventHandler = (event) => {
        if (event.key === SAVED_QUERIES_KEY) {
            this.props.setSettingValue(SAVED_QUERIES_KEY, event.newValue);
        }
    };

    updateEditor = () => {
        if (this.editorRef) {
            this.editorRef.layout();
        }
    };

    onChangeSplit = (size) => {
        this.setDefaultSizeResultPane(size);
        this.updateEditor();
    };
    setDefaultSizeResultPane = (size) => {
        localStorage.setItem(DEFAULT_SIZE_RESULT_PANE_KEY, size);
    };
    getDefaultSizeResultPane = () => {
        let size = parseInt(localStorage.getItem(DEFAULT_SIZE_RESULT_PANE_KEY), 10) || 250;
        size = `${size}px`;

        return size;
    };

    onSaveQueryHandler = (queryName) => {
        const {
            executeQuery: {input},
            savedQueries = [],
            setSettingValue,
        } = this.props;

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

    onDeleteQueryHandler = (queryName) => {
        const {savedQueries = [], setSettingValue} = this.props;
        const newSavedQueries = savedQueries.filter(
            (el) => el.name.toLowerCase() !== queryName.toLowerCase(),
        );
        setSettingValue(SAVED_QUERIES_KEY, JSON.stringify(newSavedQueries));
    };

    render() {
        const {executeQuery, explainQuery, theme, savedQueries, changeUserInput} = this.props;
        const {runAction} = executeQuery;
        const runIsDisabled = !executeQuery.input || executeQuery.loading;
        const runText = _.find(RUN_ACTIONS, {value: runAction}).title;
        const loadingResult = executeQuery.loading || explainQuery.loading;
        const result = this.renderResult();
        const showSecondPane = Boolean(result) || loadingResult;
        const defaultSizeResultPane = this.getDefaultSizeResultPane();

        return (
            <div className={b()}>
                <SplitPane
                    split="horizontal"
                    primary="second"
                    minSize={100}
                    maxSize={-57}
                    defaultSize={defaultSizeResultPane}
                    hidePane={!showSecondPane}
                    pane1Style={{minHeight: '50px'}}
                    onChange={this.onChangeSplit}
                >
                    <div className={b('pane-wrapper')}>
                        <div className={b('monaco-wrapper')}>
                            <div className={b('monaco')}>
                                <MonacoEditor
                                    language="sql"
                                    value={executeQuery.input}
                                    options={EDITOR_OPTIONS}
                                    onChange={this.onChange}
                                    editorDidMount={this.editorDidMount}
                                    theme={`vs-${theme}`}
                                />
                            </div>
                        </div>
                        <div className={b('controls')}>
                            <div className={b('control-run')}>
                                <Button
                                    onClick={this.handleSendClick}
                                    view="action"
                                    pin="round-brick"
                                    disabled={runIsDisabled}
                                    loading={executeQuery.loading}
                                >
                                    {runText}
                                </Button>
                                <Select
                                    options={RUN_ACTIONS}
                                    value={runAction}
                                    disabled={runIsDisabled}
                                    renderSwitcher={() => (
                                        <div className={b('run-switcher')}>
                                            <Button
                                                view="action"
                                                pin="brick-round"
                                                disabled={runIsDisabled}
                                                loading={executeQuery.loading}
                                            >
                                                <Icon name="chevron-down" width={16} height={16} />
                                            </Button>
                                        </div>
                                    )}
                                    onUpdate={(value) => {
                                        this.props.selectRunAction(value);
                                    }}
                                />
                            </div>
                            <Button
                                onClick={this.handleGetExplainQueryClick}
                                disabled={!executeQuery.input}
                                loading={explainQuery.loading}
                            >
                                Explain
                            </Button>
                            {this.renderHistoryNavigation()}
                            {this.renderClipboardButton()}
                            <SaveQuery
                                savedQueries={savedQueries}
                                onSaveQuery={this.onSaveQueryHandler}
                                saveButtonDisabled={runIsDisabled}
                                changeUserInput={changeUserInput}
                                onDeleteQuery={this.onDeleteQueryHandler}
                            />
                        </div>
                    </div>
                    {showSecondPane && <div className={b('pane-wrapper')}>{result}</div>}
                </SplitPane>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        executeQuery: state.executeQuery,
        explainQuery: state.explainQuery,
        theme: getSettingValue(state, THEME_KEY),
        savedQueries: parseJson(getSettingValue(state, SAVED_QUERIES_KEY)),
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
};

export default connect(mapStateToProps, mapDispatchToProps)(QueryEditor);
