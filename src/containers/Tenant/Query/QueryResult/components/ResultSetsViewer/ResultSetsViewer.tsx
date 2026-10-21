import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';
import {Flex, Label, Tab, TabList, TabProvider, Text} from '@gravity-ui/uikit';

import {QueryResultTable} from '../../../../../../components/QueryResultTable';
import type {QuerySourcePosition} from '../../../../../../store/reducers/query/types';
import type {ParsedResultSet} from '../../../../../../types/store/query';
import {cn} from '../../../../../../utils/cn';
import {configuredNumeral} from '../../../../../../utils/numeral';
import i18n from '../../i18n';
import {QueryResultError} from '../QueryResultError/QueryResultError';

import './ResultSetsViewer.scss';

const b = cn('ydb-query-result-sets-viewer');

interface ResultSetsViewerProps {
    resultSets?: ParsedResultSet[];
    selectedResultSet: number;
    rowsPerSecond?: number;
    error?: unknown;
    sourcePosition?: QuerySourcePosition;
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
                <Text>{result?.truncated ? i18n('title.truncated') : i18n('title.result')}</Text>
                <Text color="secondary">
                    {configuredNumeral(result?.result?.length || 0).format('0,0')}
                </Text>
                {props.rowsPerSecond === undefined ? null : (
                    <Label size="xs" className={b('throughput')}>
                        {i18n('value_rows-per-second', {
                            value: configuredNumeral(props.rowsPerSecond).format('0.[00]a'),
                        })}
                    </Label>
                )}
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
            {props.error ? (
                <QueryResultError error={error} sourcePosition={props.sourcePosition} />
            ) : null}
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
