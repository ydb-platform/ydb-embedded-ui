import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import type {DataTableProps} from '@gravity-ui/react-data-table';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import type {IResponseError} from '../../../../types/api/error';
import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../utils/constants';

import {b} from './utils';

interface TenantOverviewTableLayoutProps<T> extends Omit<DataTableProps<T>, 'theme'> {
    title: React.ReactNode;
    loading?: boolean;
    wasLoaded?: boolean;
    error?: IResponseError;
    tableClassNameModifiers?: {
        [name: string]: string | boolean | undefined;
    };
}

export function TenantOverviewTableLayout<T>({
    title,
    error,
    loading,
    wasLoaded,
    tableClassNameModifiers = {},
    ...props
}: TenantOverviewTableLayoutProps<T>) {
    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={TENANT_OVERVIEW_TABLES_LIMIT} />;
        }

        return (
            <DataTable theme="yandex-cloud" settings={TENANT_OVERVIEW_TABLES_SETTINGS} {...props} />
        );
    };
    return (
        <React.Fragment>
            <div className={b('title')}>{title}</div>
            <div className={b('table', tableClassNameModifiers)}>{renderContent()}</div>
        </React.Fragment>
    );
}
