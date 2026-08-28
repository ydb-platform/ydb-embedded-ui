import type {InfoViewerItem} from '../../../../../components/InfoViewer';
import {formatObject} from '../../../../../components/InfoViewer';
import {
    formatPQGroupItem,
    formatPQPartitionConfig,
    formatPQPartitionStrategy,
    formatPQTabletConfig,
} from '../../../../../components/InfoViewer/formatters';
import type {
    TEvDescribeSchemeResult,
    TPQPartitionConfig,
    TPQPartitionStrategy,
    TPQTabletConfig,
    TPersQueueGroupDescription,
} from '../../../../../types/api/schema';
import {EPQPartitionStrategyType} from '../../../../../types/api/schema';

export const prepareTopicSchemaInfo = (data?: TEvDescribeSchemeResult): Array<InfoViewerItem> => {
    const pqGroupData = data?.PathDescription?.PersQueueGroup;

    if (!pqGroupData) {
        return [];
    }

    const {Partitions = [], PQTabletConfig = {PartitionConfig: {LifetimeSeconds: 0}}} = pqGroupData;

    const {Codecs, MeteringMode, PartitionStrategy} = PQTabletConfig;
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

    let pqAutopartitioningInfo: InfoViewerItem[] = [];
    const strategyType = PartitionStrategy?.PartitionStrategyType;
    if (PartitionStrategy && strategyType) {
        // For a disabled strategy only the state itself is meaningful; otherwise show the bounds.
        const strategyFields: TPQPartitionStrategy =
            strategyType === EPQPartitionStrategyType.DISABLED
                ? {PartitionStrategyType: strategyType}
                : {
                      PartitionStrategyType: strategyType,
                      MinPartitionCount: PartitionStrategy.MinPartitionCount,
                      MaxPartitionCount: PartitionStrategy.MaxPartitionCount,
                  };
        pqAutopartitioningInfo = formatObject<TPQPartitionStrategy>(
            formatPQPartitionStrategy,
            strategyFields,
        );
    }

    return [...pqGeneralInfo, ...pqPartitionInfo, ...pqTabletInfo, ...pqAutopartitioningInfo];
};
