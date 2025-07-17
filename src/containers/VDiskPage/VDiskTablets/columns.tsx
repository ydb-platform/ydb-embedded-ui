import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {isNil} from 'lodash';

import {InternalLink} from '../../../components/InternalLink/InternalLink';
import {getTabletPagePath} from '../../../routes';
import type {VDiskBlobIndexItem} from '../../../types/api/vdiskBlobIndex';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatBytes, formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {safeParseNumber} from '../../../utils/utils';
import {vDiskPageKeyset} from '../i18n';

export function getColumns(): Column<VDiskBlobIndexItem>[] {
    return [
        {
            name: vDiskPageKeyset('tablet-id'),
            render: ({row}) => {
                const tabletId = row.TabletId;
                if (!tabletId) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return (
                    <InternalLink to={getTabletPagePath(String(tabletId))}>{tabletId}</InternalLink>
                );
            },
            width: 220,
        },
        {
            name: vDiskPageKeyset('channel-id'),
            align: DataTable.RIGHT,
            render: ({row}) => row.ChannelId ?? EMPTY_DATA_PLACEHOLDER,
            width: 130,
        },
        {
            name: vDiskPageKeyset('count'),
            align: DataTable.RIGHT,
            render: ({row}) => {
                if (isNil(row.Count)) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return formatNumber(row.Count);
            },
            width: 100,
        },
        {
            name: vDiskPageKeyset('size'),
            align: DataTable.RIGHT,
            render: ({row}) => {
                const size = row.Size;
                if (isNil(size)) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                const numericSize = safeParseNumber(size);
                return formatBytes(numericSize);
            },
            width: 120,
            sortAccessor: (row) => row.Size || 0,
        },
    ];
}
