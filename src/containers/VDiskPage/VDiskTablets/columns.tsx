import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {isNil} from 'lodash';

import {InternalLink} from '../../../components/InternalLink/InternalLink';
import {useTabletPagePath} from '../../../routes';
import type {VDiskBlobIndexItem} from '../../../types/api/vdiskBlobIndex';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {formatBytes, formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {safeParseNumber} from '../../../utils/utils';

import {COLUMNS_NAMES, COLUMNS_TITLES} from './constants';

export function getColumns(): Column<VDiskBlobIndexItem>[] {
    return [
        {
            name: COLUMNS_NAMES.TABLET_ID,
            header: COLUMNS_TITLES[COLUMNS_NAMES.TABLET_ID],
            render: ({row}) => {
                const tabletId = row.TabletId;
                if (!tabletId) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return <TabletId id={tabletId} />;
            },
            width: 220,
        },
        {
            name: COLUMNS_NAMES.CHANNEL_ID,
            header: COLUMNS_TITLES[COLUMNS_NAMES.CHANNEL_ID],
            align: DataTable.RIGHT,
            render: ({row}) => row.ChannelId ?? EMPTY_DATA_PLACEHOLDER,
            width: 130,
            sortable: true,
        },
        {
            name: COLUMNS_NAMES.COUNT,
            header: COLUMNS_TITLES[COLUMNS_NAMES.COUNT],
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
            name: COLUMNS_NAMES.SIZE,
            header: COLUMNS_TITLES[COLUMNS_NAMES.SIZE],
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
        },
    ];
}

function TabletId({id}: {id: string | number}) {
    const getTabletPagePath = useTabletPagePath();
    return <InternalLink to={getTabletPagePath(id)}>{id}</InternalLink>;
}
