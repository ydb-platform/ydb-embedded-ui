import type {CellContext, ColumnDef} from '@tanstack/react-table';

import {InternalLink} from '../../../components/InternalLink/InternalLink';
import {ColumnHeader} from '../../../components/Table/Table';
import {getTabletPagePath} from '../../../routes';
import type {VDiskBlobIndexItem} from '../../../types/api/vdiskBlobIndex';
import {cn} from '../../../utils/cn';
import {formatBytes} from '../../../utils/dataFormatters/dataFormatters';
import {vDiskPageKeyset} from '../i18n';

const b = cn('ydb-vdisk-tablets');

function TabletIdCell({row}: CellContext<VDiskBlobIndexItem, unknown>) {
    const item = row.original;
    const tabletId = item.TabletId || item.tabletId;

    if (!tabletId) {
        return <span>-</span>;
    }

    return <InternalLink to={getTabletPagePath(String(tabletId))}>{tabletId}</InternalLink>;
}

function MetricsCell({row, column}: CellContext<VDiskBlobIndexItem, unknown>) {
    const item = row.original;
    const fieldName = column.id;
    
    // Handle both PascalCase and camelCase field names
    let value;
    if (fieldName === 'ChannelId') {
        value = item.ChannelId ?? item.channelId;
    } else if (fieldName === 'Count') {
        value = item.Count ?? item.count;
    } else {
        value = item[fieldName];
    }
    
    return <span className={b('metrics-cell')}>{value ?? '-'}</span>;
}

function SizeCell({row}: CellContext<VDiskBlobIndexItem, unknown>) {
    const item = row.original;
    const size = item.Size ?? item.size;
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
