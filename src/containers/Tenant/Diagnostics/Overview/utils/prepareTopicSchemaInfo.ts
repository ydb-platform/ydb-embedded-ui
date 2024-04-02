import type {InfoViewerItem} from '../../../../../components/InfoViewer';
import {formatObject} from '../../../../../components/InfoViewer';
import {
    formatPQGroupItem,
    formatPQPartitionConfig,
    formatPQTabletConfig,
} from '../../../../../components/InfoViewer/formatters';
import type {
    TEvDescribeSchemeResult,
    TPQPartitionConfig,
    TPQTabletConfig,
    TPersQueueGroupDescription,
} from '../../../../../types/api/schema';

export const prepareTopicSchemaInfo = (data?: TEvDescribeSchemeResult): Array<InfoViewerItem> => {
    const pqGroupData = data?.PathDescription?.PersQueueGroup;

    if (!pqGroupData) {
        return [];
    }

    const {Partitions = [], PQTabletConfig = {PartitionConfig: {LifetimeSeconds: 0}}} = pqGroupData;

    const {Codecs, MeteringMode} = PQTabletConfig;
    const {WriteSpeedInBytesPerSecond, StorageLimitBytes} = PQTabletConfig.PartitionConfig;

    //@ts-expect-error
    const pqGeneralInfo = formatObject<TPersQueueGroupDescription>(formatPQGroupItem, {
        Partitions,
        PQTabletConfig,
    });
    //@ts-expect-error
    const pqPartitionInfo = formatObject<TPQPartitionConfig>(formatPQPartitionConfig, {
        StorageLimitBytes,
        WriteSpeedInBytesPerSecond,
    });
    //@ts-expect-error
    const pqTabletInfo = formatObject<TPQTabletConfig>(formatPQTabletConfig, {
        Codecs,
        MeteringMode,
    });

    return [...pqGeneralInfo, ...pqPartitionInfo, ...pqTabletInfo];
};
