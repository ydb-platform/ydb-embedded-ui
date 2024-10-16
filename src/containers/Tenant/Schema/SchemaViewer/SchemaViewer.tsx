import React from 'react';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import type {EPathType} from '../../../../types/api/schema';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useTableData} from '../../../../utils/hooks';
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
import {b} from './shared';

import './SchemaViewer.scss';

interface SchemaViewerProps {
    type?: EPathType;
    path: string;
    tenantName: string;
    extended?: boolean;
}

export const SchemaViewer = ({type, path, tenantName, extended = false}: SchemaViewerProps) => {
    const {tableData, isOverviewLoading, isViewSchemaLoading} = useTableData({
        type,
        path,
        tenantName,
    });

    const hasAutoIncrement = React.useMemo(() => {
        return tableData.some((i) => i.autoIncrement);
    }, [tableData]);

    const hasDefaultValue = React.useMemo(() => {
        return tableData.some((i) => i.defaultValue);
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
            return getRowTableColumns(extended, hasAutoIncrement, hasDefaultValue);
        }

        return [];
    }, [type, extended, hasAutoIncrement, hasDefaultValue]);

    if (isOverviewLoading || isViewSchemaLoading) {
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
