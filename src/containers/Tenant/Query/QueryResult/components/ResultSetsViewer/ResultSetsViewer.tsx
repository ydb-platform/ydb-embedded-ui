import type {Settings} from '@gravity-ui/react-data-table';
import type {TabsItemProps} from '@gravity-ui/uikit';
import {Flex, Tabs, Text} from '@gravity-ui/uikit';

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
                return {
                    id: String(index),
                    title: (
                        <Flex gap={2} alignItems="center">
                            <Text>
                                {`Result #${index + 1}${resultSets?.[index]?.truncated ? '(T)' : ''}`}
                            </Text>
                            <Text color="secondary">{resultSet.result?.length || 0}</Text>
                        </Flex>
                    ),
                };
            }) || [];

        return (
            <Tabs
                className={b('tabs')}
                size="l"
                items={tabsItems}
                activeTab={String(selectedResultSet)}
                onSelectTab={(tabId) => setSelectedResultSet(Number(tabId))}
            />
        );
    };

    const renderSingleResult = () => {
        const result = resultSets?.[0];
        return (
            <div className={b('title')}>
                <Text>{`Result ${result?.truncated ? '(T)' : ''}`}</Text>
                <Text color="secondary">{result?.result?.length || 0}</Text>
            </div>
        );
    };

    return (
        <div className={b('result-wrapper')}>
            {props.error ? <QueryResultError error={error} /> : null}
            {resultSets?.length && resultSets?.length > 1 ? renderTabs() : renderSingleResult()}
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
