import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {InternalLink} from '../../../../../components/InternalLink';
import {SpeedMultiMeter} from '../../../../../components/SpeedMultiMeter';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../lib';
import type {IPreparedConsumerData} from '../../../../../types/store/topic';
import {cn} from '../../../../../utils/cn';
import {formatDurationMs} from '../../../../../utils/dataFormatters/dataFormatters';
import {ReadLagsHeader} from '../Headers';
import {getConsumerPath} from '../getConsumerPath';
import {
    CONSUMERS_COLUMNS_IDS,
    CONSUMERS_COLUMNS_TITILES,
    CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS,
    CONSUMERS_READ_LAGS_SUB_COLUMNS_TITLES,
} from '../utils/constants';

import './Columns.scss';

const b = cn('ydb-diagnostics-consumers-columns');

export const CONSUMERS_COLUMNS_WIDTH_LS_KEY = 'consumersColumnsWidth';

export const columns: Column<IPreparedConsumerData>[] = [
    {
        name: CONSUMERS_COLUMNS_IDS.CONSUMER,
        header: CONSUMERS_COLUMNS_TITILES[CONSUMERS_COLUMNS_IDS.CONSUMER],
        align: DataTable.LEFT,
        render: ({row}) => {
            if (!row.name) {
                return EMPTY_DATA_PLACEHOLDER;
            }

            return <Consumer name={row.name} />;
        },
    },
    {
        name: CONSUMERS_COLUMNS_IDS.READ_SPEED,
        header: CONSUMERS_COLUMNS_TITILES[CONSUMERS_COLUMNS_IDS.READ_SPEED],
        align: DataTable.RIGHT,
        resizeMinWidth: 140,
        sortAccessor: (row) => row.readSpeed.perMinute,
        render: ({row}) => <SpeedMultiMeter data={row.readSpeed} />,
    },
    {
        name: CONSUMERS_COLUMNS_IDS.READ_LAGS,
        header: <ReadLagsHeader />,
        className: b('lags-header'),
        sub: [
            {
                name: CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.WRITE_LAG,
                header: CONSUMERS_READ_LAGS_SUB_COLUMNS_TITLES[
                    CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.WRITE_LAG
                ],
                align: DataTable.RIGHT,
                render: ({row}) => formatDurationMs(row.writeLag),
            },
            {
                name: CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.READ_LAG,
                header: CONSUMERS_READ_LAGS_SUB_COLUMNS_TITLES[
                    CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.READ_LAG
                ],
                align: DataTable.RIGHT,
                render: ({row}) => formatDurationMs(row.readLag),
            },
            {
                name: CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.READ_IDLE_TIME,
                header: CONSUMERS_READ_LAGS_SUB_COLUMNS_TITLES[
                    CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.READ_IDLE_TIME
                ],
                align: DataTable.RIGHT,
                render: ({row}) => formatDurationMs(row.readIdleTime),
            },
        ],
    },
];

interface ConsumerProps {
    name: string;
}

function Consumer({name}: ConsumerProps) {
    return <InternalLink to={getConsumerPath(name)}>{name}</InternalLink>;
}
