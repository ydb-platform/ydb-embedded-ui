import React from 'react';
import cn from 'bem-cn-lite';

import {EVDiskState, type TVDiskStateInfo} from '../../../types/api/vdisk';
import {EFlag} from '../../../types/api/enums';
import {
    formatStorageValuesToGb,
    stringifyVdiskId,
} from '../../../utils/dataFormatters/dataFormatters';
import {bytesToGB, bytesToSpeed} from '../../../utils/utils';
import {valueIsDefined} from '../../../utils';
import {EntityStatus} from '../../../components/EntityStatus/EntityStatus';
import InfoViewer from '../../../components/InfoViewer/InfoViewer';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';

const b = cn('kv-node-structure');

export function Vdisk({
    AllocatedSize,
    DiskSpace,
    FrontQueues,
    Guid,
    Replicated,
    VDiskState,
    VDiskId,
    VDiskSlotId,
    Kind,
    SatisfactionRank,
    AvailableSize,
    HasUnreadableBlobs,
    IncarnationGuid,
    InstanceGuid,
    StoragePoolName,
    ReadThroughput,
    WriteThroughput,
}: TVDiskStateInfo) {
    const vdiskInfo = [];

    if (valueIsDefined(VDiskSlotId)) {
        vdiskInfo.push({label: 'VDisk Slot Id', value: VDiskSlotId});
    }
    if (valueIsDefined(Guid)) {
        vdiskInfo.push({label: 'GUID', value: Guid});
    }
    if (valueIsDefined(Kind)) {
        vdiskInfo.push({label: 'Kind', value: Kind});
    }
    if (valueIsDefined(VDiskState)) {
        vdiskInfo.push({
            label: 'VDisk State',
            value: VDiskState,
        });
    }
    if (valueIsDefined(DiskSpace)) {
        vdiskInfo.push({
            label: 'Disk Space',
            value: <EntityStatus status={DiskSpace} />,
        });
    }
    if (valueIsDefined(SatisfactionRank?.FreshRank?.Flag)) {
        vdiskInfo.push({
            label: 'Fresh Rank Satisfaction',
            value: <EntityStatus status={SatisfactionRank?.FreshRank?.Flag} />,
        });
    }
    if (valueIsDefined(SatisfactionRank?.LevelRank?.Flag)) {
        vdiskInfo.push({
            label: 'Level Rank Satisfaction',
            value: <EntityStatus status={SatisfactionRank?.LevelRank?.Flag} />,
        });
    }
    vdiskInfo.push({label: 'Replicated', value: Replicated ? 'Yes' : 'No'});
    vdiskInfo.push({label: 'Allocated Size', value: bytesToGB(AllocatedSize)});
    vdiskInfo.push({label: 'Available Size', value: bytesToGB(AvailableSize)});
    if (Number(AllocatedSize) >= 0 && Number(AvailableSize) >= 0) {
        vdiskInfo.push({
            label: 'Size',
            value: (
                <ProgressViewer
                    value={AllocatedSize}
                    capacity={Number(AllocatedSize) + Number(AvailableSize)}
                    formatValues={formatStorageValuesToGb}
                    colorizeProgress={true}
                />
            ),
        });
    }

    vdiskInfo.push({
        label: 'Has Unreadable Blobs',
        value: HasUnreadableBlobs ? 'Yes' : 'No',
    });
    if (valueIsDefined(IncarnationGuid)) {
        vdiskInfo.push({label: 'Incarnation GUID', value: IncarnationGuid});
    }
    if (valueIsDefined(InstanceGuid)) {
        vdiskInfo.push({label: 'Instance GUID', value: InstanceGuid});
    }
    if (valueIsDefined(FrontQueues)) {
        vdiskInfo.push({
            label: 'Front Queues',
            value: <EntityStatus status={FrontQueues} />,
        });
    }
    if (valueIsDefined(StoragePoolName)) {
        vdiskInfo.push({label: 'Storage Pool Name', value: StoragePoolName});
    }
    vdiskInfo.push({
        label: 'Read Throughput',
        value: bytesToSpeed(ReadThroughput),
    });
    vdiskInfo.push({
        label: 'Write Throughput',
        value: bytesToSpeed(WriteThroughput),
    });

    return (
        <React.Fragment>
            <div className={b('row')}>
                <span className={b('title')}>VDisk </span>
                <EntityStatus
                    status={VDiskState === EVDiskState.OK ? EFlag.Green : EFlag.Red}
                    name={stringifyVdiskId(VDiskId)}
                />
            </div>

            <div className={b('column')}>
                <InfoViewer className={b('section')} info={vdiskInfo} />
            </div>
        </React.Fragment>
    );
}
