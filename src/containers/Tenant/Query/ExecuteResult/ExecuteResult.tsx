import React from 'react';

import type {ControlGroupOption} from '@gravity-ui/uikit';
import {RadioButton, Tabs} from '@gravity-ui/uikit';
import JSONTree from 'react-json-inspector';

import {ClipboardButton} from '../../../../components/ClipboardButton';
import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {YDBGraph} from '../../../../components/Graph/Graph';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {QueryResultTable} from '../../../../components/QueryResultTable/QueryResultTable';
import {QUERY_SETTINGS} from '../../../../lib';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import type {ColumnType, KeyValueRow} from '../../../../types/api/query';
import type {ValueOf} from '../../../../types/common';
import type {IQueryResult} from '../../../../types/store/query';
import {getArray} from '../../../../utils';
import {cn} from '../../../../utils/cn';
import {useSetting, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryError} from '../../../../utils/query';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {ResultIssues} from '../Issues/Issues';
import {QueryDuration} from '../QueryDuration/QueryDuration';
import {QuerySettingsBanner} from '../QuerySettingsBanner/QuerySettingsBanner';
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
}

export function ExecuteResult({
    data,
    error,
    isResultsCollapsed,
    onCollapseResults,
    onExpandResults,
    theme,
}: ExecuteResultProps) {
    const [selectedResultSet, setSelectedResultSet] = React.useState(0);
    const [activeSection, setActiveSection] = React.useState<SectionID>(resultOptionsIds.result);
    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    const dispatch = useTypedDispatch();
    const [useQuerySettings] = useSetting<boolean>(QUERY_SETTINGS);

    const stats = data?.stats;
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
            {useQuerySettings && <QuerySettingsBanner />}
            {renderResultSection()}
        </React.Fragment>
    );
}
