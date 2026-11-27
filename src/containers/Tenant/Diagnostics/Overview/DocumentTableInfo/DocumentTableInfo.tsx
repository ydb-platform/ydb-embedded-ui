import React from 'react';

import type {TableColumnConfig} from '@gravity-ui/uikit';
import {Flex, Table, Text} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {formatTableIndexItem} from '../../../../../components/InfoViewer/formatters';
import {Loader} from '../../../../../components/Loader';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import type {DocumentTableIndex} from '../../../../../uiFactory/types';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatBytes, formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import tenantKeyset from '../../../i18n';
import {useDocumentTableSchema} from '../../../utils/useDocumentTableSchema';
import {SchemaObjectInfo} from '../SchemaObjectInfo/SchemaObjectInfo';
import {TableInfo} from '../TableInfo';

import i18n from './i18n';

interface DocumentTableInfoProps {
    data: TEvDescribeSchemeResult;
    database: string;
    databaseFullPath: string;
    path: string;
    indexParentPath?: string;
    pollingInterval: number;
}

const statusLabels = new Map([
    ['ACTIVE', i18n('value_active')],
    ['CREATING', i18n('value_creating')],
    ['UPDATING', i18n('value_updating')],
    ['DELETING', i18n('value_deleting')],
]);

function formatStatus(status?: string) {
    const value = status?.trim();
    return value ? (statusLabels.get(value) ?? value) : undefined;
}

const indexColumns: TableColumnConfig<DocumentTableIndex>[] = [
    {id: 'name', name: i18n('field_index-name')},
    {id: 'partitionKey', name: i18n('field_partition-key'), placeholder: EMPTY_DATA_PLACEHOLDER},
    {id: 'sortKey', name: i18n('field_sort-key'), placeholder: EMPTY_DATA_PLACEHOLDER},
    {
        id: 'status',
        name: i18n('field_status'),
        template: ({status}) => formatStatus(status) ?? EMPTY_DATA_PLACEHOLDER,
    },
];

function getIndexSummary(
    data: TEvDescribeSchemeResult,
    indexes: DocumentTableIndex[] | undefined,
    indexName: string,
): YDBDefinitionListItem[] {
    const index = indexes?.find(({name}) => name === indexName);
    const size = formatTableIndexItem('DataSize', data.PathDescription?.TableIndex?.DataSize);
    return [
        {name: i18n('field_status'), content: formatStatus(index?.status)},
        {name: size.label, content: size.value},
        {name: i18n('field_partition-key'), content: index?.partitionKey},
        {name: i18n('field_sort-key'), content: index?.sortKey},
    ];
}

export function DocumentTableInfo({
    data,
    database,
    databaseFullPath,
    path,
    indexParentPath,
    pollingInterval,
}: DocumentTableInfoProps) {
    const {currentData, error, loading} = useDocumentTableSchema({
        database,
        databaseFullPath,
        path: indexParentPath ?? path,
        pollingInterval,
    });
    const info = currentData?.info;
    let summary: YDBDefinitionListItem[] = [
        {name: i18n('field_status'), content: formatStatus(info?.status)},
        {name: i18n('field_item-count'), content: formatNumber(info?.itemCount)},
        {name: i18n('field_table-size'), content: formatBytes(info?.sizeBytes)},
    ];
    const indexes = info?.globalSecondaryIndexes;

    let details: React.ReactNode = null;
    let typeLabel: string | undefined;
    if (indexParentPath) {
        typeLabel = i18n('value_global-secondary-index');
        summary = getIndexSummary(data, indexes, path.slice(indexParentPath.length + 1));
    } else if (currentData === null) {
        details = (
            <React.Fragment>
                <Text as="p" color="secondary">
                    {tenantKeyset('context_underlying-document-table')}
                </Text>
                <TableInfo
                    data={data}
                    type={data.PathDescription?.Self?.PathType}
                    database={database}
                    path={path}
                />
            </React.Fragment>
        );
    } else if (indexes?.length) {
        details = (
            <Flex direction="column" gap={2}>
                <Text as="h3" variant="subheader-2">
                    {i18n('title_global-secondary-indexes')}
                </Text>
                <Table
                    aria-label={i18n('title_global-secondary-indexes')}
                    columns={indexColumns}
                    data={indexes}
                    getRowDescriptor={({name}) => ({id: name})}
                    wordWrap
                />
            </Flex>
        );
    } else if (!error && !summary.some(({content}) => content)) {
        details = <Text color="secondary">{i18n('context_info-unavailable')}</Text>;
    }

    return (
        <React.Fragment>
            {!loading && error ? <ResponseError error={error} /> : null}
            <SchemaObjectInfo
                data={data}
                path={path}
                typeLabel={typeLabel}
                additionalItems={summary}
            />
            {loading ? <Loader /> : details}
        </React.Fragment>
    );
}
