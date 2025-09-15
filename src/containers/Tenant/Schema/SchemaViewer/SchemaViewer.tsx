import React from 'react';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {viewSchemaApi} from '../../../../store/reducers/viewSchema/viewSchema';
import type {EPathType} from '../../../../types/api/schema';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {
    isColumnEntityType,
    isExternalTableType,
    isRowTableType,
    isViewType,
} from '../../utils/schema';

import {KeysView} from './KeysView';
import {
    SCHEMA_COLUMNS_WIDTH_LS_KEY,
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
    databaseFullPath: string;
    database: string;
    extended?: boolean;
}

export const SchemaViewer = ({
    type,
    path,
    database,
    extended = false,
    databaseFullPath,
}: SchemaViewerProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    // Refresh table only in Diagnostics
    const pollingInterval = extended ? autoRefreshInterval : undefined;

    const {currentData: tableSchemaData, isFetching: isTableSchemaFetching} =
        overviewApi.useGetOverviewQuery(
            {path, database, databaseFullPath},
            {pollingInterval, skip: isViewType(type)},
        );
    const {currentData: viewColumnsData, isFetching: isViewSchemaFetching} =
        viewSchemaApi.useGetViewSchemaQuery(
            {path, database, databaseFullPath},
            {pollingInterval, skip: !isViewType(type)},
        );

    const loading =
        (isViewSchemaFetching && viewColumnsData === undefined) ||
        (isTableSchemaFetching && tableSchemaData === undefined);

    const tableData = React.useMemo(() => {
        if (isViewType(type)) {
            return prepareViewSchema(viewColumnsData);
        }

        return prepareSchemaData(type, tableSchemaData);
    }, [tableSchemaData, type, viewColumnsData]);

    const hasAutoIncrement = React.useMemo(() => {
        return tableData.some((i) => i.autoIncrement);
    }, [tableData]);

    const hasDefaultValue = React.useMemo(() => {
        return tableData.some((i) => i.defaultValue);
    }, [tableData]);

    const columns = React.useMemo(() => {
        if (isViewType(type)) {
            return getViewColumns(tableData);
        }
        if (isExternalTableType(type)) {
            return getExternalTableColumns(tableData);
        }
        if (isColumnEntityType(type)) {
            return getColumnTableColumns(tableData);
        }
        if (isRowTableType(type)) {
            return getRowTableColumns(tableData, extended, hasAutoIncrement, hasDefaultValue);
        }

        return [];
    }, [type, extended, hasAutoIncrement, hasDefaultValue, tableData]);

    if (loading) {
        return <TableSkeleton />;
    }

    return (
        <React.Fragment>
            <div className={b('keys-wrapper')}>
                <KeysView tableData={tableData} extended={extended} type="primary" />
                <KeysView tableData={tableData} extended={extended} type="partitioning" />
            </div>
            <div className={b()}>
                <ResizeableDataTable
                    columnsWidthLSKey={SCHEMA_COLUMNS_WIDTH_LS_KEY}
                    data={tableData}
                    columns={columns}
                    settings={DEFAULT_TABLE_SETTINGS}
                />
            </div>
        </React.Fragment>
    );
};
