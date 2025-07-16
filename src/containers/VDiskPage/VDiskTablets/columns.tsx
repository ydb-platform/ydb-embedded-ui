import type {CellContext, ColumnDef} from '@tanstack/react-table';

import {InternalLink} from '../../../components/InternalLink/InternalLink';
import {ColumnHeader} from '../../../components/Table/Table';
import {getTabletPagePath} from '../../../routes';
import type {VDiskBlobIndexItem} from '../../../types/api/vdiskBlobIndex';
import {cn} from '../../../utils/cn';
import {formatBytes} from '../../../utils/dataFormatters/dataFormatters';
import {vDiskPageKeyset} from '../i18n';

const b = cn('ydb-vdisk-tablets');

function TabletIdCell({getValue}: CellContext<VDiskBlobIndexItem, unknown>) {
    const tabletId = getValue<string | number>();

    if (!tabletId) {
        return <span>-</span>;
    }

    return <InternalLink to={getTabletPagePath(String(tabletId))}>{tabletId}</InternalLink>;
}

function MetricsCell({getValue}: CellContext<VDiskBlobIndexItem, unknown>) {
    const value = getValue<string | number>();
    return <span className={b('metrics-cell')}>{value ?? '-'}</span>;
}

function SizeCell({getValue}: CellContext<VDiskBlobIndexItem, unknown>) {
    const size = getValue<string | number>();
    const numericSize = Number(size) || 0;
    return <span className={b('size-cell')}>{formatBytes(numericSize)}</span>;
}

export function getColumns() {
    const columns: ColumnDef<VDiskBlobIndexItem>[] = [
        {
            accessorKey: 'TabletId',
            header: () => <ColumnHeader>{vDiskPageKeyset('tablet-id')}</ColumnHeader>,
            size: 150,
            cell: TabletIdCell,
        },
        {
            accessorKey: 'ChannelId',
            header: () => <ColumnHeader>{vDiskPageKeyset('channel-id')}</ColumnHeader>,
            size: 100,
            cell: MetricsCell,
            meta: {align: 'right'},
        },
        {
            accessorKey: 'Count',
            header: () => <ColumnHeader>{vDiskPageKeyset('count')}</ColumnHeader>,
            size: 100,
            cell: MetricsCell,
            meta: {align: 'right'},
        },
        {
            accessorKey: 'Size',
            header: () => <ColumnHeader>{vDiskPageKeyset('size')}</ColumnHeader>,
            size: 120,
            cell: SizeCell,
            meta: {align: 'right'},
        },
    ];

    return columns;
}
