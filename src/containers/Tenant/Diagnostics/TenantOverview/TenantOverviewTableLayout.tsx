import type {ReactNode} from 'react';

import DataTable from '@gravity-ui/react-data-table';
import type {DataTableProps} from '@gravity-ui/react-data-table';

import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../utils/constants';
import type {IResponseError} from '../../../../types/api/error';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import {b} from './utils';

interface TenantOverviewTableLayoutProps<T> extends Omit<DataTableProps<T>, 'theme'> {
    title: ReactNode;
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
        <>
            <div className={b('title')}>{title}</div>
            <div className={b('table', tableClassNameModifiers)}>{renderContent()}</div>
        </>
    );
}
