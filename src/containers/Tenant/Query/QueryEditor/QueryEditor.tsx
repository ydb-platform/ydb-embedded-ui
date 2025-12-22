import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';
import {isEqual} from 'lodash';
import {v4 as uuidv4} from 'uuid';

import SplitPane from '../../../../components/SplitPane';
import {
    useStreamingAvailable,
    useTracingLevelOptionAvailable,
} from '../../../../store/reducers/capabilities/hooks';
import {
    queryApi,
    selectResult,
    selectTenantPath,
    setIsDirty,
    setTenantPath,
} from '../../../../store/reducers/query/query';
import type {QueryResult} from '../../../../store/reducers/query/types';
import type {useQueriesHistory} from '../../../../store/reducers/query/useQueriesHistory';
import {setQueryAction} from '../../../../store/reducers/queryActions/queryActions';
import {selectShowPreview, setShowPreview} from '../../../../store/reducers/schema/schema';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {EPathSubType, EPathType} from '../../../../types/api/schema';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {DEFAULT_SIZE_RESULT_PANE_KEY} from '../../../../utils/constants';
import {
    useEventHandler,
    useQueryExecutionSettings,
    useQueryStreamingSetting,
    useResourcePools,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../utils/hooks';
import {useChangedQuerySettings} from '../../../../utils/hooks/useChangedQuerySettings';
import {useLastQueryExecutionSettings} from '../../../../utils/hooks/useLastQueryExecutionSettings';
import {DEFAULT_QUERY_SETTINGS, QUERY_ACTIONS, QUERY_MODES} from '../../../../utils/query';
import {reachMetricaGoal} from '../../../../utils/yaMetrica';
import {useCurrentSchema} from '../../TenantContext';
import type {InitialPaneState} from '../../utils/paneVisibilityToggleHelpers';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducer,
} from '../../utils/paneVisibilityToggleHelpers';
import {PreviewContainer} from '../Preview/Preview';
import {QueryEditorControls} from '../QueryEditorControls/QueryEditorControls';
import {QueryResultViewer} from '../QueryResult/QueryResultViewer';
import {QuerySettingsDialog} from '../QuerySettingsDialog/QuerySettingsDialog';

import {YqlEditor} from './YqlEditor';
import {queryManagerInstance} from './helpers';

import './QueryEditor.scss';

const b = cn('query-editor');

const initialTenantCommonInfoState = {
    triggerExpand: false,
    triggerCollapse: false,
    collapsed: true,
};

interface QueryEditorProps {
    changeUserInput: (arg: {input: string}) => void;
    theme: string;
    queriesHistory: ReturnType<typeof useQueriesHistory>;
}

export default function QueryEditor({theme, changeUserInput, queriesHistory}: QueryEditorProps) {
    const dispatch = useTypedDispatch();
    const {database, path, type, subType, databaseFullPath} = useCurrentSchema();
    const savedPath = useTypedSelector(selectTenantPath);
    const result = useTypedSelector(selectResult);
    const showPreview = useTypedSelector(selectShowPreview);

    const {
        historyQueries,
        historyCurrentQueryId,
        saveQueryToHistory,
        updateQueryInHistory,
        goToPreviousQuery,
        goToNextQuery,
    } = queriesHistory;

    const isResultLoaded = Boolean(result);

    const [querySettings, setQuerySettings] = useQueryExecutionSettings();
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [lastQueryExecutionSettings, setLastQueryExecutionSettings] =
        useLastQueryExecutionSettings();
    const {resetBanner} = useChangedQuerySettings();

    const [lastUsedQueryAction, setLastUsedQueryAction] = useSetting<QueryAction>(
        SETTING_KEYS.LAST_USED_QUERY_ACTION,
    );
    const [lastExecutedQueryText, setLastExecutedQueryText] = React.useState<string>('');
    const [isQueryStreamingEnabled] = useQueryStreamingSetting();

    const [binaryDataInPlainTextDisplay] = useSetting<boolean>(
        SETTING_KEYS.BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    );

    const {
        resourcePools,
        normalizedResourcePool,
        isLoading: isResourcePoolsLoading,
    } = useResourcePools(database, querySettings.resourcePool);

    const encodeTextWithBase64 = !binaryDataInPlainTextDisplay;

    const isStreamingEnabled =
        useStreamingAvailable() &&
        isQueryStreamingEnabled &&
        querySettings.queryMode === QUERY_MODES.query;

    const [sendQuery] = queryApi.useUseSendQueryMutation();
    const [streamQuery] = queryApi.useUseStreamQueryMutation();

    // Normalize stored resourcePool if it's not available for current database
    React.useEffect(() => {
        if (isResourcePoolsLoading) {
            return;
        }

        if (querySettings.resourcePool === normalizedResourcePool) {
            return;
        }

        setQuerySettings({
            ...querySettings,
            resourcePool: normalizedResourcePool,
        });
    }, [
        isResourcePoolsLoading,
        normalizedResourcePool,
        querySettings,
        resourcePools.length,
        setQuerySettings,
    ]);

    const tableSettings = React.useMemo(() => {
        return isStreamingEnabled
            ? {
                  displayIndices: {
                      maxIndex: (querySettings.limitRows || DEFAULT_QUERY_SETTINGS.limitRows) + 1,
                  },
              }
            : undefined;
    }, [isStreamingEnabled, querySettings.limitRows]);

    React.useEffect(() => {
        if (savedPath !== database) {
            dispatch(setTenantPath(database));
        }
    }, [dispatch, database, savedPath]);

    const [resultVisibilityState, dispatchResultVisibilityState] = React.useReducer(
        paneVisibilityToggleReducer,
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

        // Abort previous query if there was any
        queryManagerInstance.abortQuery();

        if (isStreamingEnabled) {
            reachMetricaGoal('runQuery', {
                actionType: 'execute',
                isStreaming: true,
                ...querySettings,
            });
            const query = streamQuery({
                actionType: 'execute',
                query: text,
                database,
                querySettings,
                enableTracingLevel,
                base64: encodeTextWithBase64,
            });

            queryManagerInstance.registerQuery(query);
        } else {
            reachMetricaGoal('runQuery', {actionType: 'execute', ...querySettings});
            const query = sendQuery({
                actionType: 'execute',
                query: text,
                database,
                querySettings,
                enableTracingLevel,
                queryId,
                base64: encodeTextWithBase64,
            });

            query
                .then(({data}) => {
                    if (data?.queryId) {
                        updateQueryInHistory(data.queryId, data?.queryStats);
                    }
                })
                .catch((error) => {
                    // Do not add query stats for failed query
                    console.error('Failed to update query history:', error);
                });

            queryManagerInstance.registerQuery(query);
        }

        dispatch(setShowPreview(false));

        // Don't save partial queries in history
        if (!partial) {
            const currentQuery = historyCurrentQueryId
                ? historyQueries.find((q) => q.queryId === historyCurrentQueryId)
                : null;
            if (text !== currentQuery?.queryText) {
                saveQueryToHistory(text, queryId);
            }
            dispatch(setIsDirty(false));
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

        reachMetricaGoal('runQuery', {actionType: 'explain', ...querySettings});

        const query = sendQuery({
            actionType: 'explain',
            query: text,
            database,
            querySettings,
            enableTracingLevel,
            queryId,
            base64: encodeTextWithBase64,
        });

        queryManagerInstance.registerQuery(query);

        dispatch(setShowPreview(false));

        dispatchResultVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    });

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
                database={database}
                queryId={result?.queryId}
                isStreamingEnabled={isStreamingEnabled}
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
                                historyQueries={historyQueries}
                                goToPreviousQuery={goToPreviousQuery}
                                goToNextQuery={goToNextQuery}
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
                        subType={subType}
                        theme={theme}
                        key={result?.queryId}
                        result={result}
                        database={database}
                        databaseFullPath={databaseFullPath}
                        path={path}
                        showPreview={showPreview}
                        queryText={lastExecutedQueryText}
                        tableSettings={tableSettings}
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
    subType?: EPathSubType;
    theme: string;
    result?: QueryResult;
    database: string;
    databaseFullPath: string;
    path: string;
    showPreview?: boolean;
    queryText: string;
    tableSettings?: Partial<Settings>;
}
function Result({
    resultVisibilityState,
    onExpandResultHandler,
    onCollapseResultHandler,
    type,
    subType,
    theme,
    result,
    database,
    databaseFullPath,
    path,
    showPreview,
    queryText,
    tableSettings,
}: ResultProps) {
    if (showPreview) {
        return (
            <PreviewContainer
                database={database}
                path={path}
                type={type}
                subType={subType}
                databaseFullPath={databaseFullPath}
            />
        );
    }

    if (result) {
        return (
            <QueryResultViewer
                result={result}
                resultType={result?.type}
                theme={theme}
                database={database}
                isResultsCollapsed={resultVisibilityState.collapsed}
                tableSettings={tableSettings}
                onExpandResults={onExpandResultHandler}
                onCollapseResults={onCollapseResultHandler}
                queryText={queryText}
            />
        );
    }

    return null;
}
