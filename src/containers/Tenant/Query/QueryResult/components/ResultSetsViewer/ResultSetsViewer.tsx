import type {Settings} from '@gravity-ui/react-data-table';
import type {TabsItemProps} from '@gravity-ui/uikit';
import {Tabs, Text} from '@gravity-ui/uikit';

import {QueryResultTable} from '../../../../../../components/QueryResultTable';
import type {ParsedResultSet} from '../../../../../../types/store/query';
import {cn} from '../../../../../../utils/cn';
import {QueryResultError} from '../QueryResultError/QueryResultError';

import './ResultSetsViewer.scss';

const b = cn('ydb-query-result-sets-viewer');

interface ResultSetsViewerProps {
    resultSets?: ParsedResultSet[];
    selectedResultSet: number;
    error?: unknown;
    tableSettings?: Partial<Settings>;
    setSelectedResultSet: (resultSet: number) => void;
}

export function ResultSetsViewer(props: ResultSetsViewerProps) {
    const {selectedResultSet, setSelectedResultSet, resultSets, error} = props;

    const currentResult = resultSets?.[selectedResultSet];

    const renderTabs = () => {
        const tabsItems: TabsItemProps[] =
            resultSets?.map((_, index) => {
                const resultSet = resultSets?.[index];
                const rowsPerSecond = resultSet?.streamMetrics?.rowsPerSecond;
                const rowsPerSecondFormatted =
                    rowsPerSecond && rowsPerSecond > 1000
                        ? `${(rowsPerSecond / 1000).toFixed(0)}k`
                        : rowsPerSecond?.toFixed(0);
                return {
                    id: String(index),
                    title: (
                        <div className={b('tab-title')}>
                            <Text>
                                {`Result ${resultSets.length > 1 ? `#${index + 1}${resultSets?.[index]?.truncated ? ' (T)' : ''}` : ''}`}
                            </Text>
                            <Text color="secondary">{resultSet.result?.length || 0}</Text>
                        </div>
                    ),
                    label: rowsPerSecondFormatted
                        ? {
                              content: `${rowsPerSecondFormatted} rows/s`,
                          }
                        : undefined,
                };
            }) || [];

        return (
            <div>
                <Tabs
                    className={b('tabs')}
                    size="l"
                    items={tabsItems}
                    activeTab={String(selectedResultSet)}
                    onSelectTab={(tabId) => setSelectedResultSet(Number(tabId))}
                />
            </div>
        );
    };

    return (
        <div className={b('result-wrapper')}>
            {props.error ? <QueryResultError error={error} /> : null}
            {renderTabs()}
            {currentResult ? (
                <div className={b('result')}>
                    <QueryResultTable
                        settings={props.tableSettings}
                        data={currentResult.result}
                        columns={currentResult.columns}
                    />
                </div>
            ) : null}
        </div>
    );
}
