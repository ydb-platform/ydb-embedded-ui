import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {InternalLink} from '../../../components/InternalLink/InternalLink';
import {getTabletPagePath} from '../../../routes';
import type {VDiskBlobIndexItem} from '../../../types/api/vdiskBlobIndex';
import {formatBytes} from '../../../utils/dataFormatters/dataFormatters';
import {vDiskPageKeyset} from '../i18n';

export function getColumns(): Column<VDiskBlobIndexItem>[] {
    return [
        {
            name: vDiskPageKeyset('tablet-id'),
            render: ({row}) => {
                const tabletId = row.TabletId;
                if (!tabletId) {
                    return <span>-</span>;
                }
                return <InternalLink to={getTabletPagePath(String(tabletId))}>{tabletId}</InternalLink>;
            },
            width: 150,
        },
        {
            name: vDiskPageKeyset('channel-id'),
            align: DataTable.RIGHT,
            render: ({row}) => row.ChannelId ?? '-',
            width: 100,
        },
        {
            name: vDiskPageKeyset('count'),
            align: DataTable.RIGHT,
            render: ({row}) => row.Count ?? '-',
            width: 100,
        },
        {
            name: vDiskPageKeyset('size'),
            align: DataTable.RIGHT,
            render: ({row}) => {
                const size = row.Size;
                const numericSize = Number(size) || 0;
                return formatBytes(numericSize);
            },
            width: 120,
            sortAccessor: (row) => row.Size || 0,
        },
    ];
}
