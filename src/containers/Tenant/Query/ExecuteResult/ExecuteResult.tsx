import React from 'react';

import type {ControlGroupOption} from '@gravity-ui/uikit';
import {Tabs} from '@gravity-ui/uikit';
import JSONTree from 'react-json-inspector';

import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {YDBGraph} from '../../../../components/Graph/Graph';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueryResultTable} from '../../../../components/QueryResultTable/QueryResultTable';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import type {ColumnType, KeyValueRow, TKqpStatsQuery} from '../../../../types/api/query';
import type {ValueOf} from '../../../../types/common';
import type {IQueryResult} from '../../../../types/store/query';
import {getArray} from '../../../../utils';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryError} from '../../../../utils/query';
import {ResultIssues} from '../Issues/Issues';
import {ResultControls} from '../ResultControls/ResultControls';
import {getPreparedResult} from '../utils/getPreparedResult';

import {getPlan} from './utils';

import './ExecuteResult.scss';

const b = cn('ydb-query-execute-result');

const resultOptionsIds = {
    result: 'result',
    stats: 'stats',
    schema: 'schema',
} as const;

type SectionID = ValueOf<typeof resultOptionsIds>;

interface ExecuteResultProps {
    data: IQueryResult | undefined;
    error: unknown;
    isResultsCollapsed?: boolean;
    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
    theme?: string;
    loading?: boolean;
}

export function ExecuteResult({
    data,
    error,
    isResultsCollapsed,
    onCollapseResults,
    onExpandResults,
    theme,
    loading,
}: ExecuteResultProps) {
    const [selectedResultSet, setSelectedResultSet] = React.useState(0);
    const [activeSection, setActiveSection] = React.useState<SectionID>(resultOptionsIds.result);

    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    const dispatch = useTypedDispatch();

    const stats: TKqpStatsQuery | undefined = data?.stats;
    const resultsSetsCount = data?.resultSets?.length;
    const isMulti = resultsSetsCount && resultsSetsCount > 0;
    const currentResult = isMulti ? data?.resultSets?.[selectedResultSet].result : data?.result;
    const currentColumns = isMulti ? data?.resultSets?.[selectedResultSet].columns : data?.columns;
    const textResults = getPreparedResult(currentResult);
    const copyDisabled = !textResults.length;
    const plan = React.useMemo(() => getPlan(data), [data]);

    const resultOptions: ControlGroupOption<SectionID>[] = [
        {value: resultOptionsIds.result, content: 'Result'},
        {value: resultOptionsIds.stats, content: 'Stats'},
    ];
    if (plan) {
        resultOptions.push({value: resultOptionsIds.schema, content: 'Schema'});
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

    const renderContent = () => {
        return (
            <React.Fragment>
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
            </React.Fragment>
        );
    };

    const renderStats = () => {
        const content = (
            <JSONTree
                data={stats}
                isExpanded={() => true}
                className={b('inspector')}
                searchOptions={{
                    debounceTime: 300,
                }}
            />
        );
        return (
            <React.Fragment>
                {content}
                {isFullscreen && (
                    <Fullscreen>
                        <div className={b('inspector', {fullscreen: true})}>{content}</div>
                    </Fullscreen>
                )}
            </React.Fragment>
        );
    };

    const renderSchema = () => {
        const isEnoughDataForGraph = plan?.links && plan?.nodes && plan?.nodes.length;

        const content = isEnoughDataForGraph ? (
            <div className={b('explain-canvas-container')}>
                <YDBGraph key={theme} data={plan} />
            </div>
        ) : null;

        return (
            <React.Fragment>
                {!isFullscreen && content}
                {isFullscreen && (
                    <Fullscreen>
                        <div className={b('result-fullscreen-wrapper')}>{content}</div>
                    </Fullscreen>
                )}
            </React.Fragment>
        );
    };

    const renderResult = () => {
        const content = renderContent();

        return (
            <React.Fragment>
                {content}
                {isFullscreen && (
                    <Fullscreen>
                        <div className={b('result-fullscreen-wrapper')}>{content}</div>
                    </Fullscreen>
                )}
            </React.Fragment>
        );
    };

    const renderIssues = () => {
        if (!parsedError) {
            return null;
        }

        if (typeof parsedError === 'object') {
            const content = <ResultIssues data={parsedError} />;

            return (
                <React.Fragment>
                    {content}
                    {isFullscreen && (
                        <Fullscreen>
                            <div className={b('result-fullscreen-wrapper', b('result'))}>
                                {content}
                            </div>
                        </Fullscreen>
                    )}
                </React.Fragment>
            );
        }

        return <div className={b('error')}>{parsedError}</div>;
    };

    const renderResultSection = () => {
        if (activeSection === resultOptionsIds.result && !error) {
            return renderResult();
        }

        if (activeSection === resultOptionsIds.schema && !error) {
            return renderSchema();
        }

        return (
            <div className={b('result')}>
                {activeSection === resultOptionsIds.stats && !error && renderStats()}
                {renderIssues()}
            </div>
        );
    };

    return (
        <React.Fragment>
            <ResultControls<SectionID>
                error={error}
                stats={stats ? {DurationUs: stats.DurationUs} : undefined}
                activeSection={activeSection}
                onSelectSection={onSelectSection}
                sectionOptions={resultOptions}
                clipboardText={textResults}
                isClipboardDisabled={copyDisabled}
                isResultsCollapsed={isResultsCollapsed}
                onCollapseResults={onCollapseResults}
                onExpandResults={onExpandResults}
                isFullscreenDisabled={Boolean(error)}
                loading={loading}
            />
            <LoaderWrapper loading={loading}>{renderResultSection()}</LoaderWrapper>
        </React.Fragment>
    );
}
