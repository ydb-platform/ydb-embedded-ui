import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Loader} from '../../../components/Loader';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import type {TThreadPoolInfo} from '../../../types/api/threads';
import {cn} from '../../../utils/cn';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';

import {CpuUsageBar} from './CpuUsageBar/CpuUsageBar';
import {ThreadStatesBar} from './ThreadStatesBar/ThreadStatesBar';
import i18n from './i18n';

import './Threads.scss';

const b = cn('threads');

interface ThreadsProps {
    className?: string;
}

interface ThreadsTableProps {
    data: TThreadPoolInfo[];
    loading?: boolean;
}

const THREADS_COLUMNS_WIDTH_LS_KEY = 'threadsTableColumnsWidth';

function ThreadsTable({data, loading}: ThreadsTableProps) {
    const columns: Column<TThreadPoolInfo>[] = [
        {
            name: 'Name',
            header: i18n('field_pool-name'),
            render: ({row}: {row: TThreadPoolInfo}) => row.Name || i18n('value_unknown'),
            sortable: false,
            width: 200,
        },
        {
            name: 'Threads',
            header: i18n('field_thread-count'),
            render: ({row}: {row: TThreadPoolInfo}) => formatNumber(row.Threads),
            sortable: false,
            align: DataTable.RIGHT,
            width: 100,
        },
        {
            name: 'CpuUsage',
            header: i18n('field_cpu-usage'),
            render: ({row}: {row: TThreadPoolInfo}) => (
                <CpuUsageBar systemUsage={row.SystemUsage} userUsage={row.UserUsage} />
            ),
            sortable: false,
            width: 200,
        },
        {
            name: 'MinorPageFaults',
            header: i18n('field_minor-page-faults'),
            render: ({row}: {row: TThreadPoolInfo}) => formatNumber(row.MinorPageFaults),
            sortable: false,
            align: DataTable.RIGHT,
            width: 120,
        },
        {
            name: 'MajorPageFaults',
            header: i18n('field_major-page-faults'),
            render: ({row}: {row: TThreadPoolInfo}) => formatNumber(row.MajorPageFaults),
            sortable: false,
            align: DataTable.RIGHT,
            width: 120,
        },
        {
            name: 'States',
            header: i18n('field_thread-states'),
            render: ({row}: {row: TThreadPoolInfo}) => (
                <ThreadStatesBar states={row.States} totalThreads={row.Threads} />
            ),
            sortable: false,
            width: 250,
        },
    ];

    if (loading) {
        return <Loader size="m" />;
    }

    if (!data.length) {
        return <div className={b('empty')}>{i18n('alert_no-thread-data')}</div>;
    }

    return (
        <div className={b('table')}>
            <ResizeableDataTable
                columnsWidthLSKey={THREADS_COLUMNS_WIDTH_LS_KEY}
                data={data}
                columns={columns}
                settings={{
                    displayIndices: false,
                    stickyHead: DataTable.MOVING,
                    syncHeadOnResize: true,
                    dynamicRender: true,
                }}
            />
        </div>
    );
}

/**
 * Main threads component for displaying thread pool information
 */
export function Threads({className}: ThreadsProps) {
    // TODO: Replace with actual API call when thread endpoint is available
    const mockData: TThreadPoolInfo[] = [
        {
            Name: 'AwsEventLoop',
            Threads: 64,
            SystemUsage: 0,
            UserUsage: 0,
            MinorPageFaults: 0,
            MajorPageFaults: 0,
            States: {S: 64},
        },
        {
            Name: 'klktmr.IC',
            Threads: 3,
            SystemUsage: 0.2917210162,
            UserUsage: 0.470575124,
            MinorPageFaults: 0,
            MajorPageFaults: 0,
            States: {R: 2, S: 1},
        },
        {
            Name: 'klktmr.IO',
            Threads: 1,
            SystemUsage: 0.001333074062,
            UserUsage: 0.001333074062,
            MinorPageFaults: 0,
            MajorPageFaults: 0,
            States: {S: 1},
        },
    ];

    const loading = false;
    const error = null;

    return (
        <div className={b(null, className)}>
            {error ? <ResponseError error={error} className={b('error')} /> : null}
            <ThreadsTable data={mockData} loading={loading} />
        </div>
    );
}
