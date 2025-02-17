import React from 'react';

import {isEqual} from 'lodash';
import {v4 as uuidv4} from 'uuid';

import SplitPane from '../../../../components/SplitPane';
import {cancelQueryApi} from '../../../../store/reducers/cancelQuery';
import {
    useStreamingAvailable,
    useTracingLevelOptionAvailable,
} from '../../../../store/reducers/capabilities/hooks';
import {
    queryApi,
    saveQueryToHistory,
    selectQueriesHistory,
    selectQueriesHistoryCurrentIndex,
    selectResult,
    selectTenantPath,
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
    ENABLE_QUERY_STREAMING,
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

import {YqlEditor} from './YqlEditor';

import './QueryEditor.scss';

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
    const dispatch = useTypedDispatch();
    const {tenantName, path, type, theme, changeUserInput} = props;
    const savedPath = useTypedSelector(selectTenantPath);
    const result = useTypedSelector(selectResult);
    const historyQueries = useTypedSelector(selectQueriesHistory);
    const historyCurrentIndex = useTypedSelector(selectQueriesHistoryCurrentIndex);
    const showPreview = useTypedSelector(selectShowPreview);

    const isResultLoaded = Boolean(result);

    const [querySettings] = useQueryExecutionSettings();
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [lastQueryExecutionSettings, setLastQueryExecutionSettings] =
        useLastQueryExecutionSettings();
    const {resetBanner} = useChangedQuerySettings();

    const [lastUsedQueryAction, setLastUsedQueryAction] = useSetting<QueryAction>(
        LAST_USED_QUERY_ACTION_KEY,
    );
    const [lastExecutedQueryText, setLastExecutedQueryText] = React.useState<string>('');
    const [isQueryStreamingEnabled] = useSetting(ENABLE_QUERY_STREAMING);
    const isStreamingEnabled = useStreamingAvailable() && isQueryStreamingEnabled;

    const [sendQuery] = queryApi.useUseSendQueryMutation();
    const [streamQuery] = queryApi.useUseStreamQueryMutation();
    const [sendCancelQuery, cancelQueryResponse] = cancelQueryApi.useCancelQueryMutation();

    const runningQueryRef = React.useRef<{abort: VoidFunction} | null>(null);

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

    const handleSendExecuteClick = useEventHandler((text: string, partial?: boolean) => {
        setLastUsedQueryAction(QUERY_ACTIONS.execute);
        setLastExecutedQueryText(text);
        if (!isEqual(lastQueryExecutionSettings, querySettings)) {
            resetBanner();
            setLastQueryExecutionSettings(querySettings);
        }
        const queryId = uuidv4();

        if (isStreamingEnabled) {
            runningQueryRef.current = streamQuery({
                actionType: 'execute',
                query: text,
                database: tenantName,
                querySettings,
                enableTracingLevel,
                queryId,
            });
        } else {
            runningQueryRef.current = sendQuery({
                actionType: 'execute',
                query: text,
                database: tenantName,
                querySettings,
                enableTracingLevel,
                queryId,
            });
        }

        dispatch(setShowPreview(false));

        // Don't save partial queries in history
        if (!partial) {
            if (text !== historyQueries[historyCurrentIndex]?.queryText) {
                dispatch(saveQueryToHistory({queryText: text, queryId}));
            }
        }
        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    });

    const handleSettingsClick = () => {
        dispatch(setQueryAction('settings'));
    };

    const handleGetExplainQueryClick = useEventHandler((text: string) => {
        setLastUsedQueryAction(QUERY_ACTIONS.explain);
        setLastExecutedQueryText(text);
        if (!isEqual(lastQueryExecutionSettings, querySettings)) {
            resetBanner();
            setLastQueryExecutionSettings(querySettings);
        }

        const queryId = uuidv4();

        runningQueryRef.current = sendQuery({
            actionType: 'explain',
            query: text,
            database: tenantName,
            querySettings,
            enableTracingLevel,
            queryId,
        });

        dispatch(setShowPreview(false));

        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    });

    const handleCancelRunningQuery = React.useCallback(() => {
        if (isStreamingEnabled && runningQueryRef.current) {
            runningQueryRef.current.abort();
        } else if (result?.queryId) {
            sendCancelQuery({queryId: result?.queryId, database: tenantName});
        }
    }, [isStreamingEnabled, result?.queryId, sendCancelQuery, tenantName]);

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
                            <YqlEditor
                                changeUserInput={changeUserInput}
                                theme={theme}
                                handleSendExecuteClick={handleSendExecuteClick}
                                handleGetExplainQueryClick={handleGetExplainQueryClick}
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
                        cancelQueryResponse={cancelQueryResponse}
                        tenantName={tenantName}
                        path={path}
                        showPreview={showPreview}
                        queryText={lastExecutedQueryText}
                        onCancelRunningQuery={handleCancelRunningQuery}
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
    cancelQueryResponse?: Pick<QueryResult, 'isLoading' | 'error'>;
    tenantName: string;
    path: string;
    showPreview?: boolean;
    queryText: string;
    onCancelRunningQuery: VoidFunction;
}
function Result({
    resultVisibilityState,
    cancelQueryResponse,
    onExpandResultHandler,
    onCollapseResultHandler,
    type,
    theme,
    result,
    tenantName,
    path,
    showPreview,
    queryText,
    onCancelRunningQuery,
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
                isCancelError={Boolean(cancelQueryResponse?.error)}
                isCancelling={Boolean(cancelQueryResponse?.isLoading)}
                onExpandResults={onExpandResultHandler}
                onCollapseResults={onCollapseResultHandler}
                queryText={queryText}
                onCancelRunningQuery={onCancelRunningQuery}
            />
        );
    }

    return null;
}
