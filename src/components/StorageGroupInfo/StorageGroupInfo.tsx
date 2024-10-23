import {Flex} from '@gravity-ui/uikit';

import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
import {valueIsDefined} from '../../utils';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {formatToMs} from '../../utils/timeParsers';
import {bytesToSpeed} from '../../utils/utils';
import {InfoViewer} from '../InfoViewer';
import type {InfoViewerProps} from '../InfoViewer/InfoViewer';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {StatusIcon} from '../StatusIcon/StatusIcon';

import {storageGroupInfoKeyset} from './i18n';

interface StorageGroupInfoProps extends Omit<InfoViewerProps, 'info'> {
    data?: PreparedStorageGroup;
    className?: string;
}

// eslint-disable-next-line complexity
export function StorageGroupInfo({data, className, ...infoViewerProps}: StorageGroupInfoProps) {
    const {
        Encryption,
        Overall,
        DiskSpace,
        MediaType,
        ErasureSpecies,
        Used,
        Limit,
        Usage,
        Read,
        Write,
        GroupGeneration,
        Latency,
        AllocationUnits,
        State,
        MissingDisks,
        Available,
        LatencyPutTabletLogMs,
        LatencyPutUserDataMs,
        LatencyGetFastMs,
    } = data || {};

    const storageGroupInfoFirstColumn = [];

    if (valueIsDefined(GroupGeneration)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('group-generation'),
            value: GroupGeneration,
        });
    }
    if (valueIsDefined(ErasureSpecies)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('erasure-species'),
            value: ErasureSpecies,
        });
    }
    if (valueIsDefined(MediaType)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('media-type'),
            value: MediaType,
        });
    }
    if (valueIsDefined(Encryption)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('encryption'),
            value: Encryption ? storageGroupInfoKeyset('yes') : storageGroupInfoKeyset('no'),
        });
    }
    if (valueIsDefined(Overall)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('overall'),
            value: <StatusIcon status={Overall} />,
        });
    }
    if (valueIsDefined(State)) {
        storageGroupInfoFirstColumn.push({label: storageGroupInfoKeyset('state'), value: State});
    }
    if (valueIsDefined(MissingDisks)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('missing-disks'),
            value: MissingDisks,
        });
    }

    const storageGroupInfoSecondColumn = [];

    if (valueIsDefined(Used) && valueIsDefined(Limit)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('used-space'),
            value: (
                <ProgressViewer
                    value={Number(Used)}
                    capacity={Number(Limit)}
                    formatValues={formatStorageValuesToGb}
                    colorizeProgress={true}
                />
            ),
        });
    }
    if (valueIsDefined(Available)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('available'),
            value: formatStorageValuesToGb(Number(Available)),
        });
    }
    if (valueIsDefined(Usage)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('usage'),
            value: `${Usage.toFixed(2)}%`,
        });
    }
    if (valueIsDefined(DiskSpace)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('disk-space'),
            value: <StatusIcon status={DiskSpace} />,
        });
    }
    if (valueIsDefined(Latency)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency'),
            value: <StatusIcon status={Latency} />,
        });
    }
    if (valueIsDefined(LatencyPutTabletLogMs)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-put-tablet-log'),
            value: formatToMs(LatencyPutTabletLogMs),
        });
    }
    if (valueIsDefined(LatencyPutUserDataMs)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-put-user-data'),
            value: formatToMs(LatencyPutUserDataMs),
        });
    }
    if (valueIsDefined(LatencyGetFastMs)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-get-fast'),
            value: formatToMs(LatencyGetFastMs),
        });
    }
    if (valueIsDefined(AllocationUnits)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('allocation-units'),
            value: AllocationUnits,
        });
    }
    if (valueIsDefined(Read)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('read-throughput'),
            value: bytesToSpeed(Number(Read)),
        });
    }
    if (valueIsDefined(Write)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('write-throughput'),
            value: bytesToSpeed(Number(Write)),
        });
    }

    return (
        <Flex className={className} gap={2} direction="row" wrap>
            <InfoViewer info={storageGroupInfoFirstColumn} {...infoViewerProps} />
            <InfoViewer info={storageGroupInfoSecondColumn} {...infoViewerProps} />
        </Flex>
    );
}
