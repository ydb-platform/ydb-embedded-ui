import React from 'react';

import {StopFill} from '@gravity-ui/icons';
import type {ControlGroupOption} from '@gravity-ui/uikit';
import {Button, Icon, RadioButton, Tabs} from '@gravity-ui/uikit';
import JSONTree from 'react-json-inspector';

import {ClipboardButton} from '../../../../components/ClipboardButton';
import Divider from '../../../../components/Divider/Divider';
import ElapsedTime from '../../../../components/ElapsedTime/ElapsedTime';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {YDBGraph} from '../../../../components/Graph/Graph';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {QueryResultTable} from '../../../../components/QueryResultTable/QueryResultTable';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import type {ColumnType, KeyValueRow, TKqpStatsQuery} from '../../../../types/api/query';
import type {ValueOf} from '../../../../types/common';
import type {IQueryResult} from '../../../../types/store/query';
import {getArray} from '../../../../utils';
import {cn} from '../../../../utils/cn';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';
import {useTypedDispatch} from '../../../../utils/hooks';
import {parseQueryError} from '../../../../utils/query';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {SimplifiedPlan} from '../ExplainResult/components/SimplifiedPlan/SimplifiedPlan';
import {ResultIssues} from '../Issues/Issues';
import {QueryDuration} from '../QueryDuration/QueryDuration';
import {QuerySettingsBanner} from '../QuerySettingsBanner/QuerySettingsBanner';
import {getPreparedResult} from '../utils/getPreparedResult';
import {isQueryCancelledError} from '../utils/isQueryCancelledError';

import i18n from './i18n';
import {getPlan} from './utils';

import './ExecuteResult.scss';

const b = cn('ydb-query-execute-result');

const resultOptionsIds = {
    result: 'result',
    stats: 'stats',
    schema: 'schema',
    simplified: 'simplified',
} as const;

type SectionID = ValueOf<typeof resultOptionsIds>;

interface ExecuteResultProps {
    data: IQueryResult | undefined;
    error: unknown;
    cancelError: unknown;
    isResultsCollapsed?: boolean;
    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
    onStopButtonClick: VoidFunction;
    theme?: string;
    loading?: boolean;
    cancelQueryLoading?: boolean;
}

export function ExecuteResult({
    data,
    error,
    cancelError,
    isResultsCollapsed,
    onCollapseResults,
    onExpandResults,
    onStopButtonClick,
    theme,
    loading,
    cancelQueryLoading,
}: ExecuteResultProps) {
    const [selectedResultSet, setSelectedResultSet] = React.useState(0);
    const [activeSection, setActiveSection] = React.useState<SectionID>(resultOptionsIds.result);
    const dispatch = useTypedDispatch();

    const stats: TKqpStatsQuery | undefined = data?.stats;
    const resultsSetsCount = data?.resultSets?.length;
    const isMulti = resultsSetsCount && resultsSetsCount > 0;
    const currentResult = isMulti ? data?.resultSets?.[selectedResultSet].result : data?.result;
    const currentColumns = isMulti ? data?.resultSets?.[selectedResultSet].columns : data?.columns;
    const {plan, simplifiedPlan} = React.useMemo(() => getPlan(data), [data]);

    const resultOptions: ControlGroupOption<SectionID>[] = [
        {value: resultOptionsIds.result, content: i18n('action.result')},
        {value: resultOptionsIds.stats, content: i18n('action.stats')},
    ];
    if (plan) {
        resultOptions.push({value: resultOptionsIds.schema, content: i18n('action.schema')});
    }
    if (simplifiedPlan?.plan) {
        resultOptions.push({
            value: resultOptionsIds.simplified,
            content: i18n('action.explain-plan'),
        });
    }

    const parsedError = parseQueryError(error);

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    const onSelectSection = (value: SectionID) => {
        setActiveSection(value);
    };

    const renderResultTable = (
        result: KeyValueRow[] | undefined,
        columns: ColumnType[] | undefined,
    ) => {
        return <QueryResultTable data={result} columns={columns} settings={{sortable: false}} />;
    };

    const renderResult = () => {
        return (
            <div className={b('result-wrapper')}>
                {isMulti && resultsSetsCount > 1 && (
                    <div>
                        <Tabs
                            className={b('result-tabs')}
                            size="l"
                            items={getArray(resultsSetsCount).map((item) => ({
                                id: String(item),
                                title: `Result #${item + 1}`,
                            }))}
                            activeTab={String(selectedResultSet)}
                            onSelectTab={(tabId) => setSelectedResultSet(Number(tabId))}
                        />
                    </div>
                )}
                <div className={b('result')}>
                    {renderResultTable(currentResult, currentColumns)}
                </div>
            </div>
        );
    };

    const getStatsToCopy = () => {
        switch (activeSection) {
            case resultOptionsIds.result: {
                const textResults = getPreparedResult(currentResult);
                return textResults;
            }
            case resultOptionsIds.stats:
                return stats;
            case resultOptionsIds.simplified:
                return simplifiedPlan?.pristine;
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

    const renderStats = () => {
        return (
            <div className={b('inspector')}>
                <JSONTree
                    data={stats}
                    isExpanded={() => true}
                    searchOptions={{
                        debounceTime: 300,
                    }}
                />
            </div>
        );
    };

    const renderSchema = () => {
        const isEnoughDataForGraph = plan?.links && plan?.nodes && plan?.nodes.length;

        if (!isEnoughDataForGraph) {
            return i18n('description.graph-is-not-supported');
        }

        return (
            <div className={b('explain-canvas-container')}>
                <YDBGraph key={theme} data={plan} />
            </div>
        );
    };

    const renderSimplified = () => {
        const {plan} = simplifiedPlan ?? {};
        if (!plan) {
            return null;
        }
        return <SimplifiedPlan plan={plan} />;
    };

    const renderIssues = () => {
        if (!parsedError) {
            return null;
        }

        if (typeof parsedError === 'object') {
            return <ResultIssues data={parsedError} />;
        }

        return <div className={b('error')}>{parsedError}</div>;
    };

    const renderResultSection = () => {
        if (error && !isQueryCancelledError(error)) {
            return renderIssues();
        }
        if (activeSection === resultOptionsIds.result) {
            return renderResult();
        }
        if (activeSection === resultOptionsIds.stats) {
            return renderStats();
        }
        if (activeSection === resultOptionsIds.schema) {
            return renderSchema();
        }
        if (activeSection === resultOptionsIds.simplified) {
            return renderSimplified();
        }

        return null;
    };

    return (
        <React.Fragment>
            <div className={b('controls')}>
                <div className={b('controls-right')}>
                    <QueryExecutionStatus error={error} loading={loading} />

                    {!error && !loading && (
                        <React.Fragment>
                            {stats?.DurationUs !== undefined && (
                                <QueryDuration duration={Number(stats.DurationUs)} />
                            )}
                            {resultOptions && activeSection && (
                                <React.Fragment>
                                    <Divider />
                                    <RadioButton
                                        options={resultOptions}
                                        value={activeSection}
                                        onUpdate={onSelectSection}
                                    />
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    )}
                    {loading ? (
                        <React.Fragment>
                            <ElapsedTime className={b('elapsed-time')} />
                            <Button
                                loading={cancelQueryLoading}
                                onClick={onStopButtonClick}
                                className={b('stop-button', {error: Boolean(cancelError)})}
                            >
                                <Icon data={StopFill} size={16} />
                                {i18n('action.stop')}
                            </Button>
                        </React.Fragment>
                    ) : null}
                </div>
                <div className={b('controls-left')}>
                    {renderClipboardButton()}
                    <EnableFullscreenButton />
                    <PaneVisibilityToggleButtons
                        onCollapse={onCollapseResults}
                        onExpand={onExpandResults}
                        isCollapsed={isResultsCollapsed}
                        initialDirection="bottom"
                    />
                </div>
            </div>
            {loading || isQueryCancelledError(error) ? null : <QuerySettingsBanner />}
            <LoaderWrapper loading={loading}>
                <Fullscreen>{renderResultSection()}</Fullscreen>
            </LoaderWrapper>
        </React.Fragment>
    );
}
