import {Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
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

    if (!isNil(GroupGeneration)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('group-generation'),
            value: GroupGeneration,
        });
    }
    if (!isNil(ErasureSpecies)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('erasure-species'),
            value: ErasureSpecies,
        });
    }
    if (!isNil(MediaType)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('media-type'),
            value: MediaType,
        });
    }
    if (!isNil(Encryption)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('encryption'),
            value: Encryption ? storageGroupInfoKeyset('yes') : storageGroupInfoKeyset('no'),
        });
    }
    if (!isNil(Overall)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('overall'),
            value: <StatusIcon status={Overall} />,
        });
    }
    if (!isNil(State)) {
        storageGroupInfoFirstColumn.push({label: storageGroupInfoKeyset('state'), value: State});
    }
    if (!isNil(MissingDisks)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('missing-disks'),
            value: MissingDisks,
        });
    }

    const storageGroupInfoSecondColumn = [];

    if (!isNil(Used) && !isNil(Limit)) {
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
    if (!isNil(Available)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('available'),
            value: formatStorageValuesToGb(Number(Available)),
        });
    }
    if (!isNil(Usage)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('usage'),
            value: `${Usage.toFixed(2)}%`,
        });
    }
    if (!isNil(DiskSpace)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('disk-space'),
            value: <StatusIcon status={DiskSpace} />,
        });
    }
    if (!isNil(Latency)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency'),
            value: <StatusIcon status={Latency} />,
        });
    }
    if (!isNil(LatencyPutTabletLogMs)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-put-tablet-log'),
            value: formatToMs(LatencyPutTabletLogMs),
        });
    }
    if (!isNil(LatencyPutUserDataMs)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-put-user-data'),
            value: formatToMs(LatencyPutUserDataMs),
        });
    }
    if (!isNil(LatencyGetFastMs)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-get-fast'),
            value: formatToMs(LatencyGetFastMs),
        });
    }
    if (!isNil(AllocationUnits)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('allocation-units'),
            value: AllocationUnits,
        });
    }
    if (!isNil(Read)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('read-throughput'),
            value: bytesToSpeed(Number(Read)),
        });
    }
    if (!isNil(Write)) {
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
