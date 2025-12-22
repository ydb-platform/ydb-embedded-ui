import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';
import {Flex, Tab, TabList, TabProvider, Text} from '@gravity-ui/uikit';

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

    const scrollRef = React.useRef<HTMLDivElement>(null);

    const currentResult = resultSets?.[selectedResultSet];

    const renderTabs = () => {
        return (
            <TabProvider value={String(selectedResultSet)}>
                <TabList className={b('tabs')} size="l">
                    {resultSets?.map((_, index) => {
                        const resultSet = resultSets?.[index];
                        return (
                            <Tab
                                key={index}
                                value={String(index)}
                                onClick={() => setSelectedResultSet(index)}
                            >
                                <Flex gap={2} alignItems="center">
                                    <Text>
                                        {`Result #${index + 1}${resultSets?.[index]?.truncated ? '(T)' : ''}`}
                                    </Text>
                                    <Text color="secondary">{resultSet.result?.length || 0}</Text>
                                </Flex>
                            </Tab>
                        );
                    })}
                </TabList>
            </TabProvider>
        );
    };

    const renderSingleResult = () => {
        const result = resultSets?.[0];
        return (
            <Flex gap={2} alignItems="center" className={b('title')}>
                <Text>{result?.truncated ? 'Truncated' : 'Result'}</Text>
                <Text color="secondary">{result?.result?.length || 0}</Text>
            </Flex>
        );
    };

    const renderResults = () => {
        if (resultSets?.length) {
            if (resultSets?.length > 1) {
                return renderTabs();
            } else {
                return renderSingleResult();
            }
        }

        return null;
    };

    return (
        <div className={b('result-wrapper')}>
            {props.error ? <QueryResultError error={error} /> : null}
            {renderResults()}
            {currentResult ? (
                <div className={b('result')} ref={scrollRef}>
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
