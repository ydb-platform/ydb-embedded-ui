import type {PreparedVDisk} from '../../utils/disks/types';
import {valueIsDefined} from '../../utils';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {bytesToSpeed} from '../../utils/utils';
import {cn} from '../../utils/cn';
import {createVDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {getVDiskPagePath} from '../../routes';

import type {InfoViewerProps} from '../InfoViewer/InfoViewer';
import {InfoViewer} from '../InfoViewer';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {vDiskInfoKeyset} from './i18n';

import './VDiskInfo.scss';

const b = cn('ydb-vdisk-info');

interface VDiskInfoProps<T extends PreparedVDisk> extends Omit<InfoViewerProps, 'info'> {
    data: T;
    isVDiskPage?: boolean;
}

// eslint-disable-next-line complexity
export function VDiskInfo<T extends PreparedVDisk>({
    data,
    isVDiskPage = false,
    ...infoViewerProps
}: VDiskInfoProps<T>) {
    const {
        AllocatedSize,
        DiskSpace,
        FrontQueues,
        Guid,
        Replicated,
        VDiskState,
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
        PDiskId,
        NodeId,
    } = data;

    const vdiskInfo = [];

    if (valueIsDefined(VDiskSlotId)) {
        vdiskInfo.push({label: vDiskInfoKeyset('slot-id'), value: VDiskSlotId});
    }
    if (valueIsDefined(StoragePoolName)) {
        vdiskInfo.push({label: vDiskInfoKeyset('pool-name'), value: StoragePoolName});
    }
    if (valueIsDefined(VDiskState)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('state-status'),
            value: VDiskState,
        });
    }
    if (Number(AllocatedSize) >= 0 && Number(AvailableSize) >= 0) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('size'),
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
    if (valueIsDefined(Kind)) {
        vdiskInfo.push({label: vDiskInfoKeyset('kind'), value: Kind});
    }
    if (valueIsDefined(Guid)) {
        vdiskInfo.push({label: vDiskInfoKeyset('guid'), value: Guid});
    }
    if (valueIsDefined(IncarnationGuid)) {
        vdiskInfo.push({label: vDiskInfoKeyset('incarnation-guid'), value: IncarnationGuid});
    }
    if (valueIsDefined(InstanceGuid)) {
        vdiskInfo.push({label: vDiskInfoKeyset('instance-guid'), value: InstanceGuid});
    }
    if (valueIsDefined(Replicated)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('replication-status'),
            value: Replicated ? vDiskInfoKeyset('yes') : vDiskInfoKeyset('no'),
        });
    }
    if (valueIsDefined(DiskSpace)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('space-status'),
            value: <EntityStatus status={DiskSpace} />,
        });
    }
    if (valueIsDefined(SatisfactionRank?.FreshRank?.Flag)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('fresh-rank-satisfaction'),
            value: <EntityStatus status={SatisfactionRank?.FreshRank?.Flag} />,
        });
    }
    if (valueIsDefined(SatisfactionRank?.LevelRank?.Flag)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('level-rank-satisfaction'),
            value: <EntityStatus status={SatisfactionRank?.LevelRank?.Flag} />,
        });
    }
    if (valueIsDefined(FrontQueues)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('front-queues'),
            value: <EntityStatus status={FrontQueues} />,
        });
    }
    if (valueIsDefined(HasUnreadableBlobs)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('has-unreadable-blobs'),
            value: HasUnreadableBlobs ? vDiskInfoKeyset('yes') : vDiskInfoKeyset('no'),
        });
    }
    if (valueIsDefined(ReadThroughput)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('read-throughput'),
            value: bytesToSpeed(ReadThroughput),
        });
    }
    if (valueIsDefined(WriteThroughput)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('write-throughput'),
            value: bytesToSpeed(WriteThroughput),
        });
    }
    if (valueIsDefined(PDiskId) && valueIsDefined(NodeId) && valueIsDefined(VDiskSlotId)) {
        const vDiskPagePath = getVDiskPagePath(VDiskSlotId, PDiskId, NodeId);
        const vDiskInternalViewerPath = createVDiskDeveloperUILink({
            nodeId: NodeId,
            pDiskId: PDiskId,
            vDiskSlotId: VDiskSlotId,
        });

        vdiskInfo.push({
            label: vDiskInfoKeyset('links'),
            value: (
                <span className={b('links')}>
                    {!isVDiskPage && (
                        <LinkWithIcon
                            title={vDiskInfoKeyset('vdisk-page')}
                            url={vDiskPagePath}
                            external={false}
                        />
                    )}
                    <LinkWithIcon
                        title={vDiskInfoKeyset('developer-ui')}
                        url={vDiskInternalViewerPath}
                    />
                </span>
            ),
        });
    }

    return <InfoViewer info={vdiskInfo} {...infoViewerProps} />;
}
