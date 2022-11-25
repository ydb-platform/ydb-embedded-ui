import type {
    TCdcStreamDescription,
    TIndexDescription,
    TPersQueueGroupDescription,
} from '../../../types/api/schema';
import {formatNumber} from '../../../utils';
import {HOUR_IN_SECONDS} from '../../../utils/constants';

import {createInfoFormatter} from '../utils';

export const formatTableIndexItem = createInfoFormatter<TIndexDescription>({
    values: {
        Type: (value) => value?.substring(10), // trims EIndexType prefix
        State: (value) => value?.substring(11), // trims EIndexState prefix
        KeyColumnNames: (value) => value?.join(', '),
        DataColumnNames: (value) => value?.join(', '),
    },
    labels: {
        KeyColumnNames: 'Columns',
        DataColumnNames: 'Includes',
    },
});

export const formatCdcStreamItem = createInfoFormatter<TCdcStreamDescription>({
    values: {
        Mode: (value) => value?.substring('ECdcStreamMode'.length),
        Format: (value) => value?.substring('ECdcStreamFormat'.length),
    },
});

export const formatPQGroupItem = createInfoFormatter<TPersQueueGroupDescription>({
    values: {
        Partitions: (value) => formatNumber(value?.length || 0),
        PQTabletConfig: (value) => {
            const hours =
                Math.round((value.PartitionConfig.LifetimeSeconds / HOUR_IN_SECONDS) * 100) / 100;
            return `${formatNumber(hours)} hours`;
        },
    },
    labels: {
        Partitions: 'Partitions count',
        PQTabletConfig: 'Retention',
    },
});
