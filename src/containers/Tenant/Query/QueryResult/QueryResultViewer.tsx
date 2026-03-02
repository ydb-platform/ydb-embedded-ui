import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';
import type {ControlGroupOption, CopyToClipboardStatus} from '@gravity-ui/uikit';
import {
    ActionTooltip,
    Button,
    ClipboardIcon,
    Flex,
    SegmentedRadioGroup,
    Text,
} from '@gravity-ui/uikit';

import {EnableFullscreenButton} from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {Fullscreen} from '../../../../components/Fullscreen/Fullscreen';
import {Illustration} from '../../../../components/Illustration';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import {selectResultTab, setResultTab} from '../../../../store/reducers/query/query';
import type {QueryResult} from '../../../../store/reducers/query/types';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {ValueOf} from '../../../../types/common';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useSetting, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {QuerySettingsBanner} from '../QuerySettingsBanner/QuerySettingsBanner';
import {QueryStoppedBanner} from '../QueryStoppedBanner/QueryStoppedBanner';
import {copyResultToClipboard, copyTextDataToClipboard} from '../utils/copyToClipboard';
import {isQueryCancelledError} from '../utils/isQueryCancelledError';

import {Ast} from './components/Ast/Ast';
import {Graph} from './components/Graph/Graph';
import {QueryInfoDropdown} from './components/QueryInfoDropdown/QueryInfoDropdown';
import {QueryJSONViewer} from './components/QueryJSONViewer/QueryJSONViewer';
import {QueryResultError} from './components/QueryResultError/QueryResultError';
import {ResultSetsViewer} from './components/ResultSetsViewer/ResultSetsViewer';
import {SimplifiedPlan} from './components/SimplifiedPlan/SimplifiedPlan';
import {StubMessage} from './components/Stub/Stub';
import {TraceButton} from './components/TraceButton/TraceButton';
import i18n from './i18n';

import './QueryResultViewer.scss';

const b = cn('ydb-query-result');

const COPY_STATUS_RESET_TIMEOUT = 1500;

const RESULT_OPTIONS_IDS = {
    result: 'result',
    schema: 'schema',
    simplified: 'simplified',
    json: 'json',
    stats: 'stats',
    ast: 'ast',
} as const;

type SectionID = ValueOf<typeof RESULT_OPTIONS_IDS>;

const RESULT_OPTIONS_TITLES: Record<SectionID, string> = {
    get result() {
        return i18n('action.result');
    },
    get schema() {
        return i18n('action.schema');
    },
    get simplified() {
        return i18n('action.explain-plan');
    },
    get json() {
        return i18n('action.json');
    },
    get stats() {
        return i18n('action.stats');
    },
    get ast() {
        return i18n('action.ast');
    },
};

const EXECUTE_SECTIONS: SectionID[] = ['result', 'schema', 'simplified', 'stats'];
const EXPLAIN_SECTIONS: SectionID[] = ['schema', 'simplified', 'json', 'ast'];

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
    const dispatch = useTypedDispatch();
    const selectedTabs = useTypedSelector(selectResultTab);

    const isExecute = resultType === 'execute';
    const isExplain = resultType === 'explain';

    const [selectedResultSet, setSelectedResultSet] = React.useState(0);
    const [useShowPlanToSvg] = useSetting<boolean>(SETTING_KEYS.USE_SHOW_PLAN_SVG);
    const [copyStatus, setCopyStatus] = React.useState<CopyToClipboardStatus>('pending');
    const copyTimeoutRef = React.useRef<number>();

    const defaultSection = isExecute ? RESULT_OPTIONS_IDS.result : RESULT_OPTIONS_IDS.schema;

    const activeSection: SectionID = React.useMemo(() => {
        const savedTab = selectedTabs?.[resultType];
        if (savedTab) {
            const validSections = isExecute ? EXECUTE_SECTIONS : EXPLAIN_SECTIONS;
            if (validSections.includes(savedTab as SectionID)) {
                return savedTab as SectionID;
            }
        }
        return defaultSection;
    }, [selectedTabs, resultType, isExecute, defaultSection]);

    const {error, isLoading, streamingStatus, data = {}} = result;
    const {preparedPlan, simplifiedPlan, stats, resultSets, ast} = data;

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

    const radioButtonOptions: ControlGroupOption<SectionID>[] = React.useMemo(() => {
        let sections: SectionID[] = [];
        if (isExecute) {
            sections = EXECUTE_SECTIONS;
        } else if (isExplain) {
            sections = EXPLAIN_SECTIONS;
        }

        return sections.map((section) => ({
            value: section,
            content: RESULT_OPTIONS_TITLES[section],
        }));
    }, [isExecute, isExplain]);

    const hasCopyableData = React.useCallback((): boolean => {
        switch (activeSection) {
            case RESULT_OPTIONS_IDS.result:
                return Boolean(data?.resultSets?.[selectedResultSet]?.result?.length);
            case RESULT_OPTIONS_IDS.json:
                return Boolean(preparedPlan?.pristine);
            case RESULT_OPTIONS_IDS.simplified:
                return Boolean(simplifiedPlan?.pristine);
            case RESULT_OPTIONS_IDS.stats:
                return Boolean(stats);
            case RESULT_OPTIONS_IDS.ast:
                return Boolean(ast);
            default:
                return false;
        }
    }, [
        activeSection,
        data?.resultSets,
        selectedResultSet,
        preparedPlan?.pristine,
        simplifiedPlan?.pristine,
        stats,
        ast,
    ]);

    const handleCopy = React.useCallback(async () => {
        window.clearTimeout(copyTimeoutRef.current);

        let success = false;
        switch (activeSection) {
            case RESULT_OPTIONS_IDS.result: {
                const currentResult = data?.resultSets?.[selectedResultSet];
                success = await copyResultToClipboard(currentResult?.result);
                break;
            }
            case RESULT_OPTIONS_IDS.json:
                success = await copyTextDataToClipboard(preparedPlan?.pristine);
                break;
            case RESULT_OPTIONS_IDS.simplified:
                success = await copyTextDataToClipboard(simplifiedPlan?.pristine);
                break;
            case RESULT_OPTIONS_IDS.stats:
                success = await copyTextDataToClipboard(stats);
                break;
            case RESULT_OPTIONS_IDS.ast:
                success = await copyTextDataToClipboard(ast);
                break;
        }

        setCopyStatus(success ? 'success' : 'error');
        copyTimeoutRef.current = window.setTimeout(() => {
            setCopyStatus('pending');
        }, COPY_STATUS_RESET_TIMEOUT);
    }, [
        activeSection,
        data?.resultSets,
        selectedResultSet,
        preparedPlan?.pristine,
        simplifiedPlan?.pristine,
        stats,
        ast,
    ]);

    const renderCopyButton = () => {
        if (isLoading || !hasCopyableData()) {
            return null;
        }

        return (
            <ActionTooltip
                title={
                    copyStatus === 'success'
                        ? i18n('action.copy-success')
                        : i18n('action.copy', {activeSection})
                }
            >
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

    const renderQueryInfoDropdown = () => {
        if (isLoading || isQueryCancelledError(error)) {
            return null;
        }

        return (
            <QueryInfoDropdown
                queryResultsInfo={{
                    queryText,
                    ast: data.ast,
                    stats: data.stats,
                    plan: data.plan,
                }}
                error={error}
                database={database}
                hasPlanToSvg={Boolean(data?.plan && useShowPlanToSvg && isExecute)}
            />
        );
    };

    const renderStubMessage = () => {
        return (
            <StubMessage
                message={i18n('description.empty-result', {
                    activeSection: RESULT_OPTIONS_TITLES[activeSection],
                })}
            />
        );
    };

    const renderCommonErrorView = (isStopped: boolean) => {
        return (
            <Flex justifyContent="center" alignItems="center" width="100%" gap={8}>
                <Illustration name="error" className={b('illustration')} />
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

    const renderNonResultSection = () => {
        switch (activeSection) {
            case RESULT_OPTIONS_IDS.schema:
                return preparedPlan?.nodes?.length ? (
                    <Graph theme={theme} explain={preparedPlan} />
                ) : (
                    renderStubMessage()
                );
            case RESULT_OPTIONS_IDS.json:
                return preparedPlan?.pristine ? (
                    <QueryJSONViewer data={preparedPlan.pristine} />
                ) : (
                    renderStubMessage()
                );
            case RESULT_OPTIONS_IDS.simplified:
                return simplifiedPlan?.plan?.length ? (
                    <SimplifiedPlan plan={simplifiedPlan.plan} />
                ) : (
                    renderStubMessage()
                );
            case RESULT_OPTIONS_IDS.stats:
                return stats ? <QueryJSONViewer data={stats} /> : renderStubMessage();
            case RESULT_OPTIONS_IDS.ast:
                return ast ? <Ast ast={ast} theme={theme} /> : renderStubMessage();
            default:
                return null;
        }
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
                    error={error}
                    selectedResultSet={selectedResultSet}
                    tableSettings={tableSettings}
                    setSelectedResultSet={setSelectedResultSet}
                />
            );
        }

        if (error) {
            return isExecute || isStopped ? (
                renderCommonErrorView(isStopped)
            ) : (
                <QueryResultError error={error} />
            );
        }

        return renderNonResultSection();
    };

    const renderLeftControls = () => {
        return (
            <div className={b('controls-left')}>
                {radioButtonOptions.length && activeSection ? (
                    <SegmentedRadioGroup
                        options={radioButtonOptions}
                        value={activeSection}
                        onUpdate={onSelectSection}
                    />
                ) : null}
                <QueryExecutionStatus
                    error={error}
                    loading={isLoading}
                    streamingStatus={streamingStatus}
                />
                {data?.traceId && isExecute ? <TraceButton traceId={data.traceId} /> : null}
            </div>
        );
    };

    const renderRightControls = () => {
        return (
            <div className={b('controls-right')}>
                {renderQueryInfoDropdown()}
                {renderCopyButton()}
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
