import {sortBy} from 'lodash';

import {EPathType} from '../../../types/api/schema';
import type {TPathDescription} from '../../../types/api/schema';
import type {DocumentTableSchema} from '../../../uiFactory/types';
import i18n from '../i18n';

import {isRowTableType, mapIndexTypeToEntityName, mapPathTypeToEntityName} from './schema';

export const getEntityName = (pathDescription?: TPathDescription) => {
    const {PathType, PathSubType} = pathDescription?.Self || {};

    if (PathType === EPathType.EPathTypeTableIndex) {
        return mapIndexTypeToEntityName(pathDescription?.TableIndex?.Type);
    }

    return mapPathTypeToEntityName(PathType, PathSubType);
};

export const isReadOnlyTable = (pathDescription?: TPathDescription) => {
    return pathDescription?.UserAttributes?.some(({Key, Value}) => {
        return Key === '__async_replica' && Value === 'true';
    });
};

export const isDocumentTable = (pathDescription?: TPathDescription) => {
    return Boolean(
        isRowTableType(pathDescription?.Self?.PathType) &&
            pathDescription?.UserAttributes?.find(({Key}) => Key === '__document_api_version')
                ?.Value,
    );
};

export function getDocumentTableTypeLabel(description?: TPathDescription) {
    return isDocumentTable(description) ? i18n('value_document-table') : undefined;
}

export const DOCUMENT_KEY_COLUMN_INDEX = {partition: 0, sort: 1} as const;

export function getOrderedDocumentAttributes(schema?: DocumentTableSchema | null) {
    return sortBy(schema?.attributes, ({keyType}) => keyType && DOCUMENT_KEY_COLUMN_INDEX[keyType]);
}
