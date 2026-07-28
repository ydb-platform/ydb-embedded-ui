import React from 'react';

import {useLocation} from 'react-router-dom';

import {buildTableIndexOverviewInfo} from '../../../../../components/InfoViewer/schemaInfo';
import {createExternalUILink, parseQuery} from '../../../../../routes';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {EPathType} from '../../../../../types/api/schema';
import {prepareReplicationItems} from '../AsyncReplicationInfo';
import {prepareChangefeedInfo} from '../ChangefeedInfo';
import {prepareColumnTableGeneralInfo} from '../TableInfo/prepareTableInfo/prepareColumnTableInfo';

import {SchemaObjectInfo} from './SchemaObjectInfo';
import {
    prepareExternalDataSourceInfo,
    prepareExternalTableInfo,
    prepareSystemViewTypeItems,
} from './prepareSpecificSchemaObjectInfo';

interface SchemaObjectInfoContainerProps {
    data?: TEvDescribeSchemeResult;
    type?: EPathType;
    path: string;
}

export function SchemaObjectInfoContainer({data, type, path}: SchemaObjectInfoContainerProps) {
    const location = useLocation();
    const externalTableInfoItems = React.useMemo(() => {
        const externalTableDescription = data?.PathDescription?.ExternalTableDescription;
        if (!externalTableDescription) {
            return [];
        }

        const pathToDataSource = createExternalUILink({
            ...parseQuery(location),
            schema: externalTableDescription.DataSourcePath,
        });

        return prepareExternalTableInfo(data, pathToDataSource);
    }, [data, location]);
    const tableIndexOverviewInfo = React.useMemo(
        () =>
            type === EPathType.EPathTypeTableIndex
                ? buildTableIndexOverviewInfo(data?.PathDescription?.TableIndex)
                : undefined,
        [data, type],
    );
    const itemsAfterType = React.useMemo(() => {
        if (type === EPathType.EPathTypeSysView) {
            return prepareSystemViewTypeItems(data);
        }

        return tableIndexOverviewInfo?.itemsAfterType;
    }, [data, tableIndexOverviewInfo, type]);
    const additionalItems = React.useMemo(() => {
        const columnTableDescription = data?.PathDescription?.ColumnTableDescription;

        switch (type) {
            case EPathType.EPathTypeColumnTable:
                return columnTableDescription
                    ? prepareColumnTableGeneralInfo(columnTableDescription)
                    : undefined;
            case EPathType.EPathTypeCdcStream:
                return prepareChangefeedInfo(data);
            case EPathType.EPathTypeExternalDataSource:
                return data ? prepareExternalDataSourceInfo(data) : undefined;
            case EPathType.EPathTypeExternalTable:
                return externalTableInfoItems;
            case EPathType.EPathTypeReplication:
                return data ? prepareReplicationItems(data) : undefined;
            default:
                return tableIndexOverviewInfo?.additionalItems;
        }
    }, [data, externalTableInfoItems, tableIndexOverviewInfo, type]);

    return (
        <SchemaObjectInfo
            data={data}
            fallbackType={type}
            path={path}
            itemsAfterType={itemsAfterType}
            additionalItems={additionalItems}
        />
    );
}
