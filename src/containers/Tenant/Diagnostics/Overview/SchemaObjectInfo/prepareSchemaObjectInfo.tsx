import {SchemaObjectTypeLabel} from '../../../../../components/SchemaObjectTypeLabel/SchemaObjectTypeLabel';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {EPathType} from '../../../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatDateTime} from '../../../../../utils/dataFormatters/dataFormatters';
import {getPathTypeName, isDomain} from '../../../ObjectSummary/transformPath';
import {dbInfoKeyset} from '../DatabaseInfo/i18n';

import {schemaObjectInfoKeyset} from './i18n';

const PATH_TYPE_DESCRIPTIONS: Record<EPathType, string | undefined> = {
    [EPathType.EPathTypeInvalid]: undefined,
    [EPathType.EPathTypeDir]: schemaObjectInfoKeyset('description_directory'),
    [EPathType.EPathTypeResourcePool]: schemaObjectInfoKeyset('description_resource-pool'),
    [EPathType.EPathTypeSecret]: schemaObjectInfoKeyset('description_secret'),
    [EPathType.EPathTypeTable]: schemaObjectInfoKeyset('description_table'),
    [EPathType.EPathTypeSysView]: schemaObjectInfoKeyset('description_system-view'),
    [EPathType.EPathTypeSubDomain]: dbInfoKeyset('description_sub-domain'),
    [EPathType.EPathTypeTableIndex]: schemaObjectInfoKeyset('description_table-index'),
    [EPathType.EPathTypeExtSubDomain]: dbInfoKeyset('description_sub-domain'),
    [EPathType.EPathTypeColumnStore]: schemaObjectInfoKeyset('description_table-store'),
    [EPathType.EPathTypeColumnTable]: schemaObjectInfoKeyset('description_column-table'),
    [EPathType.EPathTypeCdcStream]: schemaObjectInfoKeyset('description_changefeed'),
    [EPathType.EPathTypePersQueueGroup]: schemaObjectInfoKeyset('description_topic'),
    [EPathType.EPathTypeExternalTable]: schemaObjectInfoKeyset('description_external-table'),
    [EPathType.EPathTypeExternalDataSource]: schemaObjectInfoKeyset(
        'description_external-data-source',
    ),
    [EPathType.EPathTypeView]: schemaObjectInfoKeyset('description_view'),
    [EPathType.EPathTypeReplication]: schemaObjectInfoKeyset('description_replication'),
    [EPathType.EPathTypeTransfer]: schemaObjectInfoKeyset('description_transfer'),
    [EPathType.EPathTypeStreamingQuery]: schemaObjectInfoKeyset('description_streaming-query'),
};

interface PrepareSchemaObjectInfoItemsParams {
    data?: TEvDescribeSchemeResult;
    fallbackType?: EPathType;
    path: string;
    itemsAfterType?: YDBDefinitionListItem[];
    additionalItems?: YDBDefinitionListItem[];
}

function isPresent(value: string | number | undefined): value is string | number {
    return value !== undefined && value !== '';
}

function prepareTypeLabel({
    data,
    fallbackType,
    path,
}: Pick<PrepareSchemaObjectInfoItemsParams, 'data' | 'fallbackType' | 'path'>) {
    const pathDescription = data?.PathDescription;
    const self = pathDescription?.Self;
    const pathType = self?.PathType ?? fallbackType;

    const isDomainDatabase = isDomain(path, pathType);
    let value = getPathTypeName(path, pathType);
    let description: string | undefined;
    if (isDomainDatabase) {
        value = dbInfoKeyset('title_domain');
        description = dbInfoKeyset('description_domain');
    } else if (
        pathType === EPathType.EPathTypeSubDomain ||
        pathType === EPathType.EPathTypeExtSubDomain
    ) {
        value = dbInfoKeyset('title_sub-domain');
        description = dbInfoKeyset('description_sub-domain');
    } else if (pathType) {
        description = PATH_TYPE_DESCRIPTIONS[pathType];
    }

    return (
        <SchemaObjectTypeLabel value={value ?? EMPTY_DATA_PLACEHOLDER} description={description} />
    );
}

export function prepareSchemaObjectInfoItems({
    data,
    fallbackType,
    path,
    itemsAfterType = [],
    additionalItems = [],
}: PrepareSchemaObjectInfoItemsParams): YDBDefinitionListItem[] {
    const self = data?.PathDescription?.Self;
    const pathId = self?.PathId ?? data?.PathId;
    const pathVersion = self?.PathVersion;
    const created = formatDateTime(self?.CreateStep, {defaultValue: EMPTY_DATA_PLACEHOLDER});
    const fullPath = data?.Path ?? path;

    const items: YDBDefinitionListItem[] = [
        {
            name: dbInfoKeyset('title_type'),
            content: prepareTypeLabel({data, fallbackType, path}),
        },
        ...itemsAfterType,
    ];

    items.push(
        {
            name: dbInfoKeyset('title_id'),
            content: isPresent(pathId) ? pathId : EMPTY_DATA_PLACEHOLDER,
            copyText: isPresent(pathId) ? pathId : undefined,
        },
        {
            name: dbInfoKeyset('title_version'),
            content: isPresent(pathVersion) ? pathVersion : EMPTY_DATA_PLACEHOLDER,
            copyText: isPresent(pathVersion) ? pathVersion : undefined,
        },
        {
            name: dbInfoKeyset('title_created'),
            content: created,
        },
        {
            name: dbInfoKeyset('title_path'),
            content: isPresent(fullPath) ? fullPath : EMPTY_DATA_PLACEHOLDER,
            copyText: isPresent(fullPath) ? fullPath : undefined,
        },
        ...additionalItems,
    );

    return items;
}
