import React from 'react';
// Query result viewer with tab persistence functionality

import type {Settings} from '@gravity-ui/react-data-table';
import type {ControlGroupOption} from '@gravity-ui/uikit';
import {ClipboardButton, Flex, SegmentedRadioGroup, Text} from '@gravity-ui/uikit';

import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {Illustration} from '../../../../components/Illustration';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import {selectResultTab, setResultTab} from '../../../../store/reducers/query/query';
import type {QueryResult} from '../../../../store/reducers/query/types';
import type {ValueOf} from '../../../../types/common';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {USE_SHOW_PLAN_SVG_KEY} from '../../../../utils/constants';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';
import {useSetting, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {QuerySettingsBanner} from '../QuerySettingsBanner/QuerySettingsBanner';
import {QueryStoppedBanner} from '../QueryStoppedBanner/QueryStoppedBanner';
import {getPreparedResult} from '../utils/getPreparedResult';
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
    tenantName: string;
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
    tenantName,
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
    const [useShowPlanToSvg] = useSetting<boolean>(USE_SHOW_PLAN_SVG_KEY);

    // Get the saved tab for the current query type, or use default
    const getDefaultSection = (): SectionID => {
        return isExecute ? RESULT_OPTIONS_IDS.result : RESULT_OPTIONS_IDS.schema;
    };

    const activeSection: SectionID = React.useMemo(() => {
        const savedTab = selectedTabs?.[resultType];
        if (savedTab) {
            // Validate that the saved tab is valid for the current result type
            const validSections = isExecute ? EXECUTE_SECTIONS : EXPLAIN_SECTIONS;
            if (validSections.includes(savedTab as SectionID)) {
                return savedTab as SectionID;
            }
        }
        return getDefaultSection();
    }, [selectedTabs, resultType, isExecute]);

    const {error, isLoading, data = {}} = result;
    const {preparedPlan, simplifiedPlan, stats, resultSets, ast} = data;

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    const onSelectSection = (value: SectionID) => {
        dispatch(setResultTab({queryType: resultType, tabId: value}));
    };

    const radioButtonOptions: ControlGroupOption<SectionID>[] = React.useMemo(() => {
        let sections: SectionID[] = [];

        if (isExecute) {
            sections = EXECUTE_SECTIONS;
        } else if (isExplain) {
            sections = EXPLAIN_SECTIONS;
        }

        return sections.map((section) => {
            return {
                value: section,
                content: RESULT_OPTIONS_TITLES[section],
            };
        });
    }, [isExecute, isExplain]);

    const getStatsToCopy = () => {
        switch (activeSection) {
            case RESULT_OPTIONS_IDS.result: {
                const currentResult = data?.resultSets?.[selectedResultSet];
                const textResults = getPreparedResult(currentResult?.result);
                return textResults;
            }
            case RESULT_OPTIONS_IDS.json: {
                return preparedPlan?.pristine;
            }
            case RESULT_OPTIONS_IDS.simplified:
                return simplifiedPlan?.pristine;
            case RESULT_OPTIONS_IDS.stats:
                return stats;
            case RESULT_OPTIONS_IDS.ast:
                return ast;
            default:
                return undefined;
        }
    };

    const renderClipboardButton = () => {
        if (isLoading) {
            return null;
        }

        const statsToCopy = getStatsToCopy();
        const copyText = getStringifiedData(statsToCopy);
        if (!copyText) {
            return null;
        }
        return (
            <ClipboardButton
                text={copyText}
                view="flat-secondary"
                title={i18n('action.copy', {activeSection})}
            />
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
                database={tenantName}
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

        if (activeSection === RESULT_OPTIONS_IDS.schema) {
            if (!preparedPlan?.nodes?.length) {
                return renderStubMessage();
            }
            
            return <Graph theme={theme} explain={preparedPlan} />;
        }
        if (activeSection === RESULT_OPTIONS_IDS.json) {
            if (!preparedPlan?.pristine) {
                return renderStubMessage();
            }
            return <QueryJSONViewer data={preparedPlan?.pristine} />;
        }
        if (activeSection === RESULT_OPTIONS_IDS.simplified) {
            if (!simplifiedPlan?.plan?.length) {
                return renderStubMessage();
            }
            return <SimplifiedPlan plan={simplifiedPlan.plan} />;
        }
        if (activeSection === RESULT_OPTIONS_IDS.stats) {
            if (!stats) {
                return renderStubMessage();
            }
            return <QueryJSONViewer data={stats} />;
        }
        if (activeSection === RESULT_OPTIONS_IDS.ast) {
            if (!ast) {
                return renderStubMessage();
            }
            return <Ast ast={ast} theme={theme} />;
        }

        return null;
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
                <QueryExecutionStatus error={error} loading={isLoading} />
                {data?.traceId && isExecute ? <TraceButton traceId={data.traceId} /> : null}
            </div>
        );
    };

    const renderRightControls = () => {
        return (
            <div className={b('controls-right')}>
                {renderQueryInfoDropdown()}
                {renderClipboardButton()}
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
