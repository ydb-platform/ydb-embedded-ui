import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {skipToken} from '@reduxjs/toolkit/query';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {viewSchemaApi} from '../../../../store/reducers/viewSchema/viewSchema';
import type {EPathType} from '../../../../types/api/schema';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useTypedSelector} from '../../../../utils/hooks';
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
    path?: string;
    tenantName?: string | null;
    extended?: boolean;
}

export const SchemaViewer = ({type, path, tenantName, extended = false}: SchemaViewerProps) => {
    const {data: schemaData, loading} = useTypedSelector((state) => state.schema);
    const currentObjectData = path ? schemaData[path] : undefined;

    const viewSchemaRequestParams =
        isViewType(type) && path && tenantName ? {path, database: tenantName} : skipToken;

    const {data: viewColumnsData, isLoading: isViewSchemaLoading} =
        viewSchemaApi.useGetViewSchemaQuery(viewSchemaRequestParams);

    const tableData = React.useMemo(() => {
        if (isViewType(type)) {
            return prepareViewSchema(viewColumnsData);
        }

        return prepareSchemaData(type, currentObjectData);
    }, [currentObjectData, type, viewColumnsData]);

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
            return getRowTableColumns(extended);
        }

        return [];
    }, [type, extended]);

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
