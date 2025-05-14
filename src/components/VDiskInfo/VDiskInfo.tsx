import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {getVDiskPagePath} from '../../routes';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {getSeverityColor} from '../../utils/disks/helpers';
import type {PreparedVDisk} from '../../utils/disks/types';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {bytesToSpeed} from '../../utils/utils';
import {InfoViewer} from '../InfoViewer';
import type {InfoViewerProps} from '../InfoViewer/InfoViewer';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {StatusIcon} from '../StatusIcon/StatusIcon';

import {vDiskInfoKeyset} from './i18n';

import './VDiskInfo.scss';

const b = cn('ydb-vdisk-info');

interface VDiskInfoProps<T extends PreparedVDisk> extends Omit<InfoViewerProps, 'info'> {
    data?: T;
    withVDiskPageLink?: boolean;
    withTitle?: boolean;
}

// eslint-disable-next-line complexity
export function VDiskInfo<T extends PreparedVDisk>({
    data,
    withVDiskPageLink,
    withTitle,
    ...infoViewerProps
}: VDiskInfoProps<T>) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

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
    } = data || {};

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
            value: <StatusIcon status={DiskSpace} />,
        });
    }
    if (valueIsDefined(SatisfactionRank?.FreshRank?.Flag)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('fresh-rank-satisfaction'),
            value: <StatusIcon status={SatisfactionRank?.FreshRank?.Flag} />,
        });
    }
    if (valueIsDefined(SatisfactionRank?.LevelRank?.Flag)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('level-rank-satisfaction'),
            value: <StatusIcon status={SatisfactionRank?.LevelRank?.Flag} />,
        });
    }
    if (valueIsDefined(FrontQueues)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('front-queues'),
            value: <StatusIcon status={FrontQueues} />,
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

    const diskParamsDefined =
        valueIsDefined(PDiskId) && valueIsDefined(NodeId) && valueIsDefined(VDiskSlotId);

    if (diskParamsDefined) {
        const links: React.ReactNode[] = [];

        if (withVDiskPageLink) {
            const vDiskPagePath = getVDiskPagePath({
                vDiskSlotId: VDiskSlotId,
                pDiskId: PDiskId,
                nodeId: NodeId,
            });
            links.push(
                <LinkWithIcon
                    key={vDiskPagePath}
                    title={vDiskInfoKeyset('vdisk-page')}
                    url={vDiskPagePath}
                    external={false}
                />,
            );
        }

        if (isUserAllowedToMakeChanges) {
            const vDiskInternalViewerPath = createVDiskDeveloperUILink({
                nodeId: NodeId,
                pDiskId: PDiskId,
                vDiskSlotId: VDiskSlotId,
            });

            links.push(
                <LinkWithIcon
                    key={vDiskInternalViewerPath}
                    title={vDiskInfoKeyset('developer-ui')}
                    url={vDiskInternalViewerPath}
                />,
            );
        }

        if (links.length) {
            vdiskInfo.push({
                label: vDiskInfoKeyset('links'),
                value: (
                    <Flex wrap="wrap" gap={2}>
                        {links}
                    </Flex>
                ),
            });
        }
    }

    const title = data && withTitle ? <VDiskTitle data={data} /> : null;

    return <InfoViewer info={vdiskInfo} title={title} {...infoViewerProps} />;
}

interface VDiskTitleProps<T extends PreparedVDisk> {
    data: T;
}

function VDiskTitle<T extends PreparedVDisk>({data}: VDiskTitleProps<T>) {
    return (
        <div className={b('title')}>
            {vDiskInfoKeyset('vdiks-title')}
            <StatusIcon status={getSeverityColor(data.Severity)} />
            {data.StringifiedId}
        </div>
    );
}
