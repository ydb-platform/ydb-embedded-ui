import type React from 'react';

import {FloppyDisk} from '@gravity-ui/icons';
import type {Column} from '@gravity-ui/react-data-table';
import type {TextProps} from '@gravity-ui/uikit';
import {ActionTooltip, Button, Flex, Icon, Text} from '@gravity-ui/uikit';

import {YDBSyntaxHighlighter} from '../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import type {YDBDefinitionListItem} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {EnhancedQueryInHistory, QueryInHistory} from '../../../../store/reducers/query/types';
import {valueIsDefined} from '../../../../utils';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatDateTime, formatDurationMs} from '../../../../utils/dataFormatters/dataFormatters';
import {parseUsToMs} from '../../../../utils/timeParsers';
import i18n from '../i18n';

import {b} from './shared';

type QueryActions = {
    openInEditor: (query: QueryInHistory) => void;
    saveQuery: (queryBody: string) => void;
};

export function getColumns({openInEditor, saveQuery}: QueryActions) {
    const columns: Column<QueryInHistory>[] = [
        {
            name: 'startTime',
            header: i18n('history.startTime'),
            render: ({row}) => {
                if (!row.endTime || row.durationUs === undefined) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                const startTime = Number(row.endTime) - parseUsToMs(row.durationUs);
                return (
                    <Text variant="body-1" as="div">
                        {formatDateTime(startTime.toString())}
                    </Text>
                );
            },
            width: 200,
            sortable: false,
        },
        {
            name: 'Duration',
            header: i18n('history.duration'),
            render: ({row: {durationUs}}) => {
                if (!valueIsDefined(durationUs)) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return <QueryDuration durationUs={durationUs} as="div" />;
            },

            align: 'right',
            width: 150,
            sortable: false,
        },
        {
            name: 'queryText',
            header: i18n('history.queryText'),
            render: ({row}) => {
                return (
                    <YDBSyntaxHighlighter
                        language="yql"
                        className={b('query')}
                        text={row.queryText}
                    />
                );
            },
            sortable: false,
            width: 600,
        },
        {
            name: 'actions',
            header: '',
            render: ({row}) => {
                return (
                    <Flex className={b('actions')} gap={2}>
                        <ActionTooltip title={i18n('action.save-query')}>
                            <Button
                                qa="save-query-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    saveQuery(row.queryText);
                                }}
                            >
                                <Icon data={FloppyDisk} />
                            </Button>
                        </ActionTooltip>
                        <Button
                            qa="open-in-editor-button"
                            view="action"
                            onClick={(e) => {
                                e.stopPropagation();
                                openInEditor(row);
                            }}
                        >
                            {i18n('action_open-in-editor')}
                        </Button>
                    </Flex>
                );
            },
            sortable: false,
            resizeable: false,
        },
    ];

    return columns;
}

export function getQueryInfoItems(query: EnhancedQueryInHistory) {
    const items: YDBDefinitionListItem[] = [];

    const {startTime, durationUs} = query;

    if (valueIsDefined(startTime)) {
        items.push({
            name: i18n('history.startTime'),
            content: formatDateTime(query.startTime),
        });
    }
    if (valueIsDefined(durationUs)) {
        items.push({
            name: i18n('history.duration'),
            content: <QueryDuration durationUs={durationUs} textVariant="body-2" />,
        });
    }

    return items;
}

interface QueryDurationProps {
    durationUs: string | number;
    textVariant?: TextProps['variant'];
    as?: React.ElementType;
}

function QueryDuration({durationUs, textVariant = 'body-1', as}: QueryDurationProps) {
    const formatted = formatDurationMs(parseUsToMs(durationUs), true);
    if (!valueIsDefined(formatted)) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    const splitted = formatted.split('.');
    const ms = splitted.pop();
    return (
        <Text variant={textVariant} as={as}>
            {splitted.join('.')}
            <Text color="secondary" variant={textVariant}>
                .{ms}
            </Text>
        </Text>
    );
}
