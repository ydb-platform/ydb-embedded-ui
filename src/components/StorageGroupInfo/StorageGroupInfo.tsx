import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {bytesToSpeed} from '../../utils/utils';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {InfoViewer} from '../InfoViewer';
import type {InfoViewerProps} from '../InfoViewer/InfoViewer';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';

import {storageGroupInfoKeyset} from './i18n';

import './StorageGroupInfo.scss';

const b = cn('ydb-storage-group-info');

interface StorageGroupInfoProps extends Omit<InfoViewerProps, 'info'> {
    data?: PreparedStorageGroup;
    className?: string;
}

// eslint-disable-next-line complexity
export function StorageGroupInfo({data, className, ...infoViewerProps}: StorageGroupInfoProps) {
    const {
        GroupId,
        PoolName,
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
        LatencyPutTabletLog,
        LatencyPutUserData,
        LatencyGetFast,
    } = data || {};

    const storageGroupInfoFirstColumn = [];

    if (valueIsDefined(GroupId)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('group-id'),
            value: GroupId,
        });
    }
    if (valueIsDefined(GroupGeneration)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('group-generation'),
            value: GroupGeneration,
        });
    }
    if (valueIsDefined(PoolName)) {
        storageGroupInfoFirstColumn.push({
            label: storageGroupInfoKeyset('pool-name'),
            value: PoolName,
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
            value: <EntityStatus status={Overall} />,
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
            value: <EntityStatus status={DiskSpace} />,
        });
    }
    if (valueIsDefined(Latency)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency'),
            value: <EntityStatus status={Latency} />,
        });
    }
    if (valueIsDefined(LatencyPutTabletLog)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-put-tablet-log'),
            value: `${LatencyPutTabletLog} ms`,
        });
    }
    if (valueIsDefined(LatencyPutUserData)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-put-user-data'),
            value: `${LatencyPutUserData} ms`,
        });
    }
    if (valueIsDefined(LatencyGetFast)) {
        storageGroupInfoSecondColumn.push({
            label: storageGroupInfoKeyset('latency-get-fast'),
            value: `${LatencyGetFast} ms`,
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
        <div className={b('wrapper', className)}>
            <div className={b('col')}>
                <InfoViewer info={storageGroupInfoFirstColumn} {...infoViewerProps} />
            </div>
            <div className={b('col')}>
                <InfoViewer info={storageGroupInfoSecondColumn} {...infoViewerProps} />
            </div>
        </div>
    );
}
