import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';
import type {CopyToClipboardStatus} from '@gravity-ui/uikit';
import {
    ActionTooltip,
    Button,
    ClipboardIcon,
    Flex,
    SegmentedRadioGroup,
    Text,
    Tooltip,
} from '@gravity-ui/uikit';

import {EnableFullscreenButton} from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {Fullscreen} from '../../../../components/Fullscreen/Fullscreen';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import {
    selectActiveTab,
    selectResultTab,
    setQueryPlanColumnSizing,
    setQueryPlanView,
    setResultTab,
} from '../../../../store/reducers/query/query';
import type {QueryPlanView, QueryResult} from '../../../../store/reducers/query/types';
import {setQueryAction} from '../../../../store/reducers/queryActions/queryActions';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {getIllustration} from '../../../../utils/illustrations';
import {isExecutionQueryAction} from '../../../../utils/query';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {QuerySettingsBanner} from '../QuerySettingsBanner/QuerySettingsBanner';
import {QueryStoppedBanner} from '../QueryStoppedBanner/QueryStoppedBanner';
import {copyResultToClipboard, copyTextDataToClipboard} from '../utils/copyToClipboard';
import {isQueryCancelledError} from '../utils/isQueryCancelledError';

import {DiagnosticsButton} from './components/DiagnosticsButton/DiagnosticsButton';
import {PlanSection} from './components/PlanSection/PlanSection';
import {QueryPlanNotEnabled} from './components/QueryPlanNotEnabled/QueryPlanNotEnabled';
import {QueryResultError} from './components/QueryResultError/QueryResultError';
import {ResultSetsViewer} from './components/ResultSetsViewer/ResultSetsViewer';
import {TraceButton} from './components/TraceButton/TraceButton';
import type {SectionID} from './constants';
import {RESULT_OPTIONS_IDS, getResultSections, resolveResultSection} from './constants';
import i18n from './i18n';
import {getResultRowsPerSecond, isQueryPlanNotEnabled} from './utils';

import './QueryResultViewer.scss';

const b = cn('ydb-query-result');

const COPY_STATUS_RESET_TIMEOUT = 1500;

const RESULT_OPTIONS_TITLES: Record<SectionID, string> = {
    get result() {
        return i18n('action.result');
    },
    get 'query-plan'() {
        return i18n('title_query-plan');
    },
    get 'execution-plan'() {
        return i18n('title_execution-plan');
    },
    get stats() {
        return i18n('action.stats');
    },
    get ast() {
        return i18n('action.ast');
    },
};

interface ExecuteResultProps {
    result: QueryResult;
    resultType?: QueryAction;
    isResultsCollapsed?: boolean;
    theme?: string;
    database: string;
    queryText?: string;
    tableSettings?: Partial<Settings>;

    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
}

export function QueryResultViewer({
    result,
    resultType = 'execute',
    isResultsCollapsed,
    theme,
    database,
    queryText,
    tableSettings,
    onCollapseResults,
    onExpandResults,
}: ExecuteResultProps) {
    const InternalErrorImage = getIllustration('InternalError');

    const dispatch = useTypedDispatch();
    const selectedTabs = useTypedSelector(selectResultTab);
    const activeTab = useTypedSelector(selectActiveTab);
    const planView = activeTab?.queryPlanView ?? 'table';
    const onPlanViewChange = (view: QueryPlanView) => {
        if (activeTab) {
            dispatch(
                setQueryPlanView({tabId: activeTab.id, executionId: result.executionId, view}),
            );
        }
    };

    const isExecutionResult = isExecutionQueryAction(resultType);
    const hasResultSection = getResultSections(resultType).includes(RESULT_OPTIONS_IDS.result);

    const [resultSetSelection, setResultSetSelection] = React.useState({
        executionId: result.executionId,
        index: 0,
    });
    const selectedResultSet =
        resultSetSelection.executionId === result.executionId ? resultSetSelection.index : 0;
    const setSelectedResultSet = (index: number) =>
        setResultSetSelection({executionId: result.executionId, index});
    const [astTooltipOpen, setAstTooltipOpen] = React.useState(false);
    const [copyStatus, setCopyStatus] = React.useState<CopyToClipboardStatus>('pending');
    const copyTimeoutRef = React.useRef<number>();

    const activeSection = resolveResultSection(resultType, selectedTabs?.[resultType]);

    const {error, isLoading, streamingStatus, data = {}} = result;
    const {preparedPlan, stats, resultSets, ast} = data;
    const rawPlan = data.plan ?? preparedPlan?.pristine;
    const resultSetCount = resultSets?.filter(Boolean).length ?? 0;
    const currentResultRows = resultSets?.[selectedResultSet]?.result;
    const copyData = {
        [RESULT_OPTIONS_IDS.result]: currentResultRows,
        [RESULT_OPTIONS_IDS.queryPlan]: rawPlan,
        [RESULT_OPTIONS_IDS.executionPlan]: undefined,
        [RESULT_OPTIONS_IDS.stats]: stats,
        [RESULT_OPTIONS_IDS.ast]: ast,
    }[activeSection];

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
            window.clearTimeout(copyTimeoutRef.current);
        };
    }, [dispatch]);

    const onSelectSection = (value: SectionID) => {
        dispatch(setResultTab({queryType: resultType, tabId: value}));
        setCopyStatus('pending');
        window.clearTimeout(copyTimeoutRef.current);
    };

    const radioButtonOptions = getResultSections(resultType).map((section) => (
        <SegmentedRadioGroup.Option
            key={section}
            value={section}
            onFocus={() => setAstTooltipOpen(section === RESULT_OPTIONS_IDS.ast)}
            onBlur={() => setAstTooltipOpen(false)}
            controlProps={
                section === RESULT_OPTIONS_IDS.ast
                    ? {
                          'aria-description': i18n('context_ast'),
                          onMouseEnter: () => setAstTooltipOpen(true),
                          onMouseLeave: (event) => {
                              if (event.currentTarget !== document.activeElement) {
                                  setAstTooltipOpen(false);
                              }
                          },
                      }
                    : undefined
            }
        >
            {section === RESULT_OPTIONS_IDS.ast ? (
                <Tooltip
                    content={i18n('context_ast')}
                    open={astTooltipOpen}
                    onOpenChange={setAstTooltipOpen}
                    openDelay={500}
                >
                    <span>{RESULT_OPTIONS_TITLES[section]}</span>
                </Tooltip>
            ) : (
                <React.Fragment>
                    {RESULT_OPTIONS_TITLES[section]}
                    {section === RESULT_OPTIONS_IDS.result ? (
                        <Text color="secondary"> {resultSetCount}</Text>
                    ) : null}
                </React.Fragment>
            )}
        </SegmentedRadioGroup.Option>
    ));

    const handleCopy = React.useCallback(async () => {
        window.clearTimeout(copyTimeoutRef.current);

        const success =
            activeSection === RESULT_OPTIONS_IDS.result
                ? await copyResultToClipboard(currentResultRows)
                : await copyTextDataToClipboard(copyData);

        setCopyStatus(success ? 'success' : 'error');
        copyTimeoutRef.current = window.setTimeout(() => {
            setCopyStatus('pending');
        }, COPY_STATUS_RESET_TIMEOUT);
    }, [activeSection, currentResultRows, copyData]);

    const getCopyTooltipTitle = (status: CopyToClipboardStatus): string => {
        if (status === 'success') {
            return i18n('action.copy-success');
        }
        if (status === 'error') {
            return i18n('action.copy-error');
        }
        return i18n('action.copy', {activeSection});
    };

    const renderCopyButton = () => {
        const hasCopyableData =
            activeSection === RESULT_OPTIONS_IDS.result
                ? Boolean(currentResultRows?.length)
                : Boolean(copyData);
        if (isLoading || !hasCopyableData) {
            return null;
        }

        return (
            <ActionTooltip title={getCopyTooltipTitle(copyStatus)}>
                <Button
                    view="flat-secondary"
                    onClick={handleCopy}
                    aria-label={i18n('action.copy', {activeSection})}
                >
                    <Button.Icon>
                        <ClipboardIcon status={copyStatus} size={16} />
                    </Button.Icon>
                </Button>
            </ActionTooltip>
        );
    };

    const renderDiagnosticsButton = () => {
        if (isLoading || isQueryCancelledError(error)) {
            return null;
        }

        return (
            <DiagnosticsButton
                queryText={queryText}
                ast={data.ast}
                stats={data.stats}
                plan={data.plan}
                error={error}
                database={database}
            />
        );
    };

    const renderCommonErrorView = (isStopped: boolean) => {
        return (
            <Flex justifyContent="center" alignItems="center" width="100%" gap={8}>
                <InternalErrorImage width={230} height={230} className={b('illustration')} />
                <Flex direction="column" gap={2}>
                    <Text variant="subheader-2">
                        {isStopped ? i18n('stopped.title') : i18n('error.title')}
                    </Text>
                    <Text color="complementary">
                        {isStopped ? i18n('stopped.description') : i18n('error.description')}
                    </Text>
                </Flex>
            </Flex>
        );
    };

    const renderResultSection = () => {
        const isStopped = isQueryCancelledError(error);

        if (activeSection === RESULT_OPTIONS_IDS.result) {
            if (error && isStopped && !resultSets?.length) {
                return renderCommonErrorView(isStopped);
            }

            return (
                <ResultSetsViewer
                    resultSets={resultSets}
                    rowsPerSecond={getResultRowsPerSecond(result)}
                    error={error}
                    selectedResultSet={selectedResultSet}
                    tableSettings={tableSettings}
                    setSelectedResultSet={setSelectedResultSet}
                    sourcePosition={result.sourcePosition}
                />
            );
        }

        if (error) {
            if ((isExecutionResult && hasResultSection) || isStopped) {
                return renderCommonErrorView(isStopped);
            }
            return <QueryResultError error={error} sourcePosition={result.sourcePosition} />;
        }

        if (activeSection === RESULT_OPTIONS_IDS.queryPlan && isQueryPlanNotEnabled(result)) {
            return (
                <QueryPlanNotEnabled onOpenSettings={() => dispatch(setQueryAction('settings'))} />
            );
        }

        return (
            <PlanSection
                activeSection={activeSection}
                sectionTitle={RESULT_OPTIONS_TITLES[activeSection]}
                data={data}
                planView={planView}
                columnSizing={activeTab?.queryPlanColumnSizing}
                onColumnSizingChange={(sizing) => {
                    if (activeTab) {
                        dispatch(
                            setQueryPlanColumnSizing({
                                tabId: activeTab.id,
                                executionId: result.executionId,
                                sizing,
                            }),
                        );
                    }
                }}
                onPlanViewChange={onPlanViewChange}
                database={database}
                executionId={result.executionId}
                theme={theme}
            />
        );
    };

    const renderLeftControls = () => {
        return (
            <div className={b('controls-left')}>
                {radioButtonOptions.length && activeSection ? (
                    <SegmentedRadioGroup
                        aria-label={i18n('title_result-views')}
                        value={activeSection}
                        onUpdate={onSelectSection}
                    >
                        {radioButtonOptions}
                    </SegmentedRadioGroup>
                ) : null}
                <QueryExecutionStatus
                    error={error}
                    loading={isLoading}
                    streamingStatus={streamingStatus}
                />
                {data?.traceId && isExecutionResult ? <TraceButton traceId={data.traceId} /> : null}
            </div>
        );
    };

    const renderRightControls = () => {
        return (
            <div className={b('controls-right')}>
                {renderCopyButton()}
                {renderDiagnosticsButton()}
                <EnableFullscreenButton />
                <PaneVisibilityToggleButtons
                    onCollapse={onCollapseResults}
                    onExpand={onExpandResults}
                    isCollapsed={isResultsCollapsed}
                    initialDirection="bottom"
                />
            </div>
        );
    };

    const isCancelled = isQueryCancelledError(error);

    return (
        <React.Fragment>
            <div className={b('controls')}>
                {renderLeftControls()}
                {renderRightControls()}
            </div>
            {isLoading || isCancelled ? null : <QuerySettingsBanner />}
            {isCancelled && data.resultSets?.length ? <QueryStoppedBanner /> : null}
            <LoaderWrapper loading={isLoading && (!data.resultSets || activeSection !== 'result')}>
                <Fullscreen className={b('result')}>{renderResultSection()}</Fullscreen>
            </LoaderWrapper>
        </React.Fragment>
    );
}
