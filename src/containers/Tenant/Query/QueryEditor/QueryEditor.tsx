import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';
import {isEqual} from 'lodash';
import {StringParam, useQueryParams} from 'use-query-params';
import {v4 as uuidv4} from 'uuid';

import SplitPane from '../../../../components/SplitPane';
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
    setIsDirty,
    setTenantPath,
} from '../../../../store/reducers/query/query';
import type {QueryResult} from '../../../../store/reducers/query/types';
import {setQueryAction} from '../../../../store/reducers/queryActions/queryActions';
import {selectShowPreview, setShowPreview} from '../../../../store/reducers/schema/schema';
import type {EPathSubType, EPathType} from '../../../../types/api/schema';
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
import {DEFAULT_QUERY_SETTINGS, QUERY_ACTIONS, QUERY_MODES} from '../../../../utils/query';
import {useCurrentSchema} from '../../TenantContext';
import type {InitialPaneState} from '../../utils/paneVisibilityToggleHelpers';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
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
}

export default function QueryEditor(props: QueryEditorProps) {
    const dispatch = useTypedDispatch();
    const {database: tenantName, path, type, subType} = useCurrentSchema();
    const {theme, changeUserInput} = props;
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
    const [isQueryStreamingEnabled] = useSetting<boolean>(ENABLE_QUERY_STREAMING);

    // Temporary check: disable streaming if backend parameter contains "oidc"
    const [{backend}] = useQueryParams({backend: StringParam});
    const isOidcBackend = backend && backend.includes('oidc');

    const isStreamingEnabled =
        useStreamingAvailable() &&
        isQueryStreamingEnabled &&
        querySettings.queryMode === QUERY_MODES.query &&
        !isOidcBackend;

    const [sendQuery] = queryApi.useUseSendQueryMutation();
    const [streamQuery] = queryApi.useUseStreamQueryMutation();

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
            const query = streamQuery({
                actionType: 'execute',
                query: text,
                database: tenantName,
                querySettings,
                enableTracingLevel,
            });

            queryManagerInstance.registerQuery(query);
        } else {
            const query = sendQuery({
                actionType: 'execute',
                query: text,
                database: tenantName,
                querySettings,
                enableTracingLevel,
                queryId,
            });

            queryManagerInstance.registerQuery(query);
        }

        dispatch(setShowPreview(false));

        // Don't save partial queries in history
        if (!partial) {
            if (text !== historyQueries[historyCurrentIndex]?.queryText) {
                dispatch(saveQueryToHistory({queryText: text, queryId}));
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

        const query = sendQuery({
            actionType: 'explain',
            query: text,
            database: tenantName,
            querySettings,
            enableTracingLevel,
            queryId,
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
                tenantName={tenantName}
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
                        tenantName={tenantName}
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
    tenantName: string;
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
    tenantName,
    path,
    showPreview,
    queryText,
    tableSettings,
}: ResultProps) {
    if (showPreview) {
        return <PreviewContainer database={tenantName} path={path} type={type} subType={subType} />;
    }

    if (result) {
        return (
            <QueryResultViewer
                result={result}
                resultType={result?.type}
                theme={theme}
                tenantName={tenantName}
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
