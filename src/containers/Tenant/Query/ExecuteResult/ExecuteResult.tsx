import React from 'react';

import {RadioButton, Tabs} from '@gravity-ui/uikit';
import JSONTree from 'react-json-inspector';

import {ClipboardButton} from '../../../../components/ClipboardButton';
import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {QueryResultTable} from '../../../../components/QueryResultTable/QueryResultTable';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import type {ColumnType, KeyValueRow} from '../../../../types/api/query';
import type {ValueOf} from '../../../../types/common';
import type {IQueryResult, QueryErrorResponse} from '../../../../types/store/query';
import {getArray} from '../../../../utils';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {prepareQueryError} from '../../../../utils/query';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {ResultIssues} from '../Issues/Issues';
import {QueryDuration} from '../QueryDuration/QueryDuration';
import {getPreparedResult} from '../utils/getPreparedResult';

import './ExecuteResult.scss';

const b = cn('ydb-query-execute-result');

const resultOptionsIds = {
    result: 'result',
    stats: 'stats',
} as const;

type SectionID = ValueOf<typeof resultOptionsIds>;

const resultOptions = [
    {value: resultOptionsIds.result, content: 'Result'},
    {value: resultOptionsIds.stats, content: 'Stats'},
];

interface ExecuteResultProps {
    data: IQueryResult | undefined;
    stats: IQueryResult['stats'] | undefined;
    error: string | QueryErrorResponse | undefined;
    isResultsCollapsed?: boolean;
    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
}

export function ExecuteResult({
    data,
    stats,
    error,
    isResultsCollapsed,
    onCollapseResults,
    onExpandResults,
}: ExecuteResultProps) {
    const [selectedResultSet, setSelectedResultSet] = React.useState(0);
    const [activeSection, setActiveSection] = React.useState<SectionID>(resultOptionsIds.result);

    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    const dispatch = useTypedDispatch();

    const resultsSetsCount = data?.resultSets?.length;
    const isMulti = resultsSetsCount && resultsSetsCount > 0;
    const currentResult = isMulti ? data?.resultSets?.[selectedResultSet].result : data?.result;
    const currentColumns = isMulti ? data?.resultSets?.[selectedResultSet].columns : data?.columns;
    const textResults = getPreparedResult(currentResult);
    const copyDisabled = !textResults.length;

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    const onSelectSection = (value: string) => {
        setActiveSection(value as SectionID);
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

    const renderClipboardButton = () => {
        return (
            <ClipboardButton
                text={textResults}
                view="flat-secondary"
                title="Copy results"
                disabled={copyDisabled}
            />
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
        if (!error) {
            return null;
        }

        if (typeof error === 'object' && error.data?.issues && Array.isArray(error.data.issues)) {
            const content = <ResultIssues data={error.data} />;

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

        const parsedError = typeof error === 'string' ? error : prepareQueryError(error);

        return <div className={b('error')}>{parsedError}</div>;
    };

    const renderResultSection = () => {
        if (activeSection === resultOptionsIds.result && !error) {
            return renderResult();
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
            <div className={b('controls')}>
                <div className={b('controls-right')}>
                    <QueryExecutionStatus error={error} />

                    {stats && !error && (
                        <React.Fragment>
                            <QueryDuration duration={stats?.DurationUs} />
                            <Divider />
                            <RadioButton
                                options={resultOptions}
                                value={activeSection}
                                onUpdate={onSelectSection}
                            />
                        </React.Fragment>
                    )}
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

            {renderResultSection()}
        </React.Fragment>
    );
}
