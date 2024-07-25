import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {skipToken} from '@reduxjs/toolkit/query';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {useGetSchemaQuery} from '../../../../store/reducers/schema/schema';
import {viewSchemaApi} from '../../../../store/reducers/viewSchema/viewSchema';
import type {EPathType} from '../../../../types/api/schema';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {
    isColumnEntityType,
    isExternalTableType,
    isRowTableType,
    isViewType,
} from '../../utils/schema';

import {
    SCHEMA_COLUMNS_WIDTH_LS_KEY,
    SCHEMA_TABLE_COLUMS_IDS,
    getColumnTableColumns,
    getExternalTableColumns,
    getRowTableColumns,
    getViewColumns,
} from './columns';
import {prepareSchemaData, prepareViewSchema} from './prepareData';
import {b} from './shared';

import './SchemaViewer.scss';

interface SchemaViewerProps {
    type?: EPathType;
    path: string;
    tenantName: string;
    extended?: boolean;
}

export const SchemaViewer = ({type, path, tenantName, extended = false}: SchemaViewerProps) => {
    const {data: schemaData, isLoading: loading} = useGetSchemaQuery({path, database: tenantName});

    const viewSchemaRequestParams = isViewType(type) ? {path, database: tenantName} : skipToken;

    const {data: viewColumnsData, isLoading: isViewSchemaLoading} =
        viewSchemaApi.useGetViewSchemaQuery(viewSchemaRequestParams);

    const tableData = React.useMemo(() => {
        if (isViewType(type)) {
            return prepareViewSchema(viewColumnsData);
        }

        return prepareSchemaData(type, schemaData);
    }, [schemaData, type, viewColumnsData]);

    const hasAutoIncrement = React.useMemo(() => {
        return tableData.some((i) => i.autoIncrement);
    }, [tableData]);

    const columns = React.useMemo(() => {
        if (isViewType(type)) {
            return getViewColumns();
        }
        if (isExternalTableType(type)) {
            return getExternalTableColumns();
        }
        if (isColumnEntityType(type)) {
            return getColumnTableColumns();
        }
        if (isRowTableType(type)) {
            return getRowTableColumns(extended, hasAutoIncrement);
        }

        return [];
    }, [type, extended, hasAutoIncrement]);

    const renderContent = () => {
        if (loading || isViewSchemaLoading) {
            return <TableSkeleton />;
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={SCHEMA_COLUMNS_WIDTH_LS_KEY}
                data={tableData}
                columns={columns}
                settings={DEFAULT_TABLE_SETTINGS}
                initialSortOrder={{
                    columnId: SCHEMA_TABLE_COLUMS_IDS.isKeyColumn,
                    order: DataTable.ASCENDING,
                }}
            />
        );
    };

    return <div className={b(null)}>{renderContent()}</div>;
};
