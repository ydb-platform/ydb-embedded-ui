import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import type {ResizeableDataTableProps} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../utils/constants';

import {b} from './utils';

interface TenantOverviewTableLayoutProps<T> extends ResizeableDataTableProps<T> {
    title: React.ReactNode;
    loading?: boolean;
    error?: unknown;
    tableClassNameModifiers?: {
        [name: string]: string | boolean | undefined;
    };
}

export function TenantOverviewTableLayout<T>({
    title,
    error,
    loading,
    tableClassNameModifiers = {},
    ...props
}: TenantOverviewTableLayoutProps<T>) {
    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading) {
            return <TableSkeleton rows={TENANT_OVERVIEW_TABLES_LIMIT} />;
        }

        return <ResizeableDataTable settings={TENANT_OVERVIEW_TABLES_SETTINGS} {...props} />;
    };
    return (
        <React.Fragment>
            <div className={b('title')}>{title}</div>
            <div className={b('table', tableClassNameModifiers)}>{renderContent()}</div>
        </React.Fragment>
    );
}
