import type {
    TEvDescribeSchemeResult,
    TPersQueueGroupDescription,
    TPQTabletConfig,
    TPQPartitionConfig,
} from '../../../../../types/api/schema';

import {formatObject, InfoViewerItem} from '../../../../../components/InfoViewer';
import {
    formatPQGroupItem,
    formatPQPartitionConfig,
    formatPQTabletConfig,
} from '../../../../../components/InfoViewer/formatters';

export const prepareTopicSchemaInfo = (data?: TEvDescribeSchemeResult): Array<InfoViewerItem> => {
    const pqGroupData = data?.PathDescription?.PersQueueGroup;

    if (!pqGroupData) {
        return [];
    }

    const {Partitions = [], PQTabletConfig = {PartitionConfig: {LifetimeSeconds: 0}}} = pqGroupData;

    const {Codecs, MeteringMode} = PQTabletConfig;
    const {WriteSpeedInBytesPerSecond, StorageLimitBytes} = PQTabletConfig.PartitionConfig;

    const pqGeneralInfo = formatObject<TPersQueueGroupDescription>(formatPQGroupItem, {
        Partitions,
        PQTabletConfig,
    });
    const pqPartitionInfo = formatObject<TPQPartitionConfig>(formatPQPartitionConfig, {
        StorageLimitBytes,
        WriteSpeedInBytesPerSecond,
    });
    const pqTabletInfo = formatObject<TPQTabletConfig>(formatPQTabletConfig, {
        Codecs,
        MeteringMode,
    });

    return [...pqGeneralInfo, ...pqPartitionInfo, ...pqTabletInfo];
};
