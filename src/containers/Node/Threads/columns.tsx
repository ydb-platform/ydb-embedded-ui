import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {TitleWithHelpMark} from '../../../components/TitleWithHelpmark/TitleWithHelpmark';
import type {TThreadPoolInfo} from '../../../types/api/threads';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {safeParseNumber} from '../../../utils/utils';

import {CpuUsageBar} from './CpuUsageBar/CpuUsageBar';
import {ThreadStatesBar} from './ThreadStatesBar/ThreadStatesBar';
import i18n from './i18n';

export const columns: Column<TThreadPoolInfo>[] = [
    {
        name: 'Name',
        header: i18n('field_pool-name'),
        render: ({row}) => row.Name || i18n('value_unknown'),
        width: 200,
    },
    {
        name: 'Threads',
        header: i18n('field_thread-count'),
        render: ({row}) => formatNumber(row.Threads),
        align: DataTable.RIGHT,
        width: 100,
    },
    {
        name: 'CpuUsage',
        header: (
            <TitleWithHelpMark
                header={i18n('field_cpu-usage')}
                note={i18n('description_cpu-usage')}
            />
        ),
        render: ({row}) => <CpuUsageBar systemUsage={row.SystemUsage} userUsage={row.UserUsage} />,
        sortAccessor: (row) => safeParseNumber(row.SystemUsage) + safeParseNumber(row.UserUsage),
        width: 200,
    },
    {
        name: 'MinorPageFaults',
        header: i18n('field_minor-page-faults'),
        render: ({row}) => formatNumber(row.MinorPageFaults),
        align: DataTable.RIGHT,
        width: 145,
    },
    {
        name: 'MajorPageFaults',
        header: i18n('field_major-page-faults'),
        render: ({row}) => formatNumber(row.MajorPageFaults),
        align: DataTable.RIGHT,
        width: 145,
    },
    {
        name: 'States',
        header: i18n('field_thread-states'),
        render: ({row}) => <ThreadStatesBar states={row.States} totalThreads={row.Threads} />,
        sortable: false,
        width: 250,
    },
];
