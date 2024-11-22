import React from 'react';

import type {ControlGroupOption} from '@gravity-ui/uikit';
import {ClipboardButton, RadioButton} from '@gravity-ui/uikit';

import Divider from '../../../../components/Divider/Divider';
import ElapsedTime from '../../../../components/ElapsedTime/ElapsedTime';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import type {QueryResult} from '../../../../store/reducers/query/types';
import type {ValueOf} from '../../../../types/common';
import type {QueryAction} from '../../../../types/store/query';
import {valueIsDefined} from '../../../../utils';
import {cn} from '../../../../utils/cn';
import {USE_SHOW_PLAN_SVG_KEY} from '../../../../utils/constants';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';
import {useSetting, useTypedDispatch} from '../../../../utils/hooks';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {CancelQueryButton} from '../CancelQueryButton/CancelQueryButton';
import {QueryDuration} from '../QueryDuration/QueryDuration';
import {QuerySettingsBanner} from '../QuerySettingsBanner/QuerySettingsBanner';
import {getPreparedResult} from '../utils/getPreparedResult';
import {isQueryCancelledError} from '../utils/isQueryCancelledError';

import {Ast} from './components/Ast/Ast';
import {Graph} from './components/Graph/Graph';
import {PlanToSvgButton} from './components/PlanToSvgButton/PlanToSvgButton';
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
const EXPLAIN_SECTIONS: SectionID[] = ['schema', 'json', 'simplified', 'ast'];

interface ExecuteResultProps {
    result: QueryResult;
    resultType?: QueryAction;
    isResultsCollapsed?: boolean;
    theme?: string;
    tenantName: string;
    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
}

export function QueryResultViewer({
    result,
    resultType = 'execute',
    isResultsCollapsed,
    theme,
    tenantName,
    onCollapseResults,
    onExpandResults,
}: ExecuteResultProps) {
    const dispatch = useTypedDispatch();

    const isExecute = resultType === 'execute';
    const isExplain = resultType === 'explain';

    const [selectedResultSet, setSelectedResultSet] = React.useState(0);
    const [activeSection, setActiveSection] = React.useState<SectionID>(() => {
        return isExecute ? RESULT_OPTIONS_IDS.result : RESULT_OPTIONS_IDS.schema;
    });
    const [useShowPlanToSvg] = useSetting<boolean>(USE_SHOW_PLAN_SVG_KEY);

    const {error, isLoading, queryId, data = {}} = result;
    const {preparedPlan, simplifiedPlan, stats, resultSets, ast} = data;

    React.useEffect(() => {
        if (resultType === 'execute' && !EXECUTE_SECTIONS.includes(activeSection)) {
            setActiveSection('result');
        }
        if (resultType === 'explain' && !EXPLAIN_SECTIONS.includes(activeSection)) {
            setActiveSection('schema');
        }
    }, [activeSection, resultType]);

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

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    const onSelectSection = (value: SectionID) => {
        setActiveSection(value);
    };

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

    const renderStubMessage = () => {
        return (
            <StubMessage
                message={i18n('description.empty-result', {
                    activeSection: RESULT_OPTIONS_TITLES[activeSection],
                })}
            />
        );
    };

    const renderResultSection = () => {
        if (error) {
            return <QueryResultError error={error} />;
        }
        if (activeSection === RESULT_OPTIONS_IDS.result) {
            return (
                <ResultSetsViewer
                    resultSets={resultSets}
                    selectedResultSet={selectedResultSet}
                    setSelectedResultSet={setSelectedResultSet}
                />
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
                <QueryExecutionStatus error={error} loading={isLoading} />
                {!error && !isLoading && (
                    <React.Fragment>
                        {valueIsDefined(stats?.DurationUs) ? (
                            <QueryDuration duration={Number(stats.DurationUs)} />
                        ) : null}
                        {radioButtonOptions.length && activeSection ? (
                            <React.Fragment>
                                <Divider />
                                <RadioButton
                                    options={radioButtonOptions}
                                    value={activeSection}
                                    onUpdate={onSelectSection}
                                />
                            </React.Fragment>
                        ) : null}
                    </React.Fragment>
                )}
                {isLoading ? (
                    <React.Fragment>
                        <ElapsedTime className={b('elapsed-time')} />
                        <CancelQueryButton queryId={queryId} tenantName={tenantName} />
                    </React.Fragment>
                ) : null}
                {data?.traceId && isExecute ? (
                    <TraceButton traceId={data.traceId} isTraceReady={result.isTraceReady} />
                ) : null}
                {data?.plan && useShowPlanToSvg && isExecute ? (
                    <PlanToSvgButton plan={data?.plan} database={tenantName} />
                ) : null}
            </div>
        );
    };

    const renderRightControls = () => {
        return (
            <div className={b('controls-right')}>
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

    return (
        <React.Fragment>
            <div className={b('controls')}>
                {renderLeftControls()}
                {renderRightControls()}
            </div>
            {isLoading || isQueryCancelledError(error) ? null : <QuerySettingsBanner />}
            <LoaderWrapper loading={isLoading}>
                <Fullscreen className={b('result')}>{renderResultSection()}</Fullscreen>
            </LoaderWrapper>
        </React.Fragment>
    );
}
