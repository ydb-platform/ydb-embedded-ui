import cn from 'bem-cn-lite';

import DataTable from '@gravity-ui/react-data-table';
import type {DataTableProps, THEMES} from '@gravity-ui/react-data-table';

import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../utils/constants';
import type {IResponseError} from '../../../../types/api/error';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {ResponseError} from '../../../../components/Errors/ResponseError';

const b = cn('tenant-overview');

interface TenantOverviewTableLayoutProps<T> extends Omit<DataTableProps<T>, 'theme'> {
    theme?: THEMES | string;
    title: string;
    loading?: boolean;
    wasLoaded?: boolean;
    error?: IResponseError;
    tableClassNameModifiers?: {
        [name: string]: string | boolean | undefined;
    };
}

export function TenantOverviewTableLayout<T>({
    title,
    data,
    columns,
    error,
    loading,
    wasLoaded,
    emptyDataMessage,
    tableClassNameModifiers = {},
}: TenantOverviewTableLayoutProps<T>) {
    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={TENANT_OVERVIEW_TABLES_LIMIT} />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                data={data || []}
                columns={columns}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                emptyDataMessage={emptyDataMessage}
            />
        );
    };
    return (
        <>
            <div className={b('title')}>{title}</div>
            <div className={b('table', tableClassNameModifiers)}>{renderContent()}</div>
        </>
    );
}
