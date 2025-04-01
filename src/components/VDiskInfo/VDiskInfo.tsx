import React from 'react';

import {Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {getVDiskPagePath} from '../../routes';
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

    if (!isNil(VDiskSlotId)) {
        vdiskInfo.push({label: vDiskInfoKeyset('slot-id'), value: VDiskSlotId});
    }
    if (!isNil(StoragePoolName)) {
        vdiskInfo.push({label: vDiskInfoKeyset('pool-name'), value: StoragePoolName});
    }
    if (!isNil(VDiskState)) {
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
    if (!isNil(Kind)) {
        vdiskInfo.push({label: vDiskInfoKeyset('kind'), value: Kind});
    }
    if (!isNil(Guid)) {
        vdiskInfo.push({label: vDiskInfoKeyset('guid'), value: Guid});
    }
    if (!isNil(IncarnationGuid)) {
        vdiskInfo.push({label: vDiskInfoKeyset('incarnation-guid'), value: IncarnationGuid});
    }
    if (!isNil(InstanceGuid)) {
        vdiskInfo.push({label: vDiskInfoKeyset('instance-guid'), value: InstanceGuid});
    }
    if (!isNil(Replicated)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('replication-status'),
            value: Replicated ? vDiskInfoKeyset('yes') : vDiskInfoKeyset('no'),
        });
    }
    if (!isNil(DiskSpace)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('space-status'),
            value: <StatusIcon status={DiskSpace} />,
        });
    }
    if (!isNil(SatisfactionRank?.FreshRank?.Flag)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('fresh-rank-satisfaction'),
            value: <StatusIcon status={SatisfactionRank?.FreshRank?.Flag} />,
        });
    }
    if (!isNil(SatisfactionRank?.LevelRank?.Flag)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('level-rank-satisfaction'),
            value: <StatusIcon status={SatisfactionRank?.LevelRank?.Flag} />,
        });
    }
    if (!isNil(FrontQueues)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('front-queues'),
            value: <StatusIcon status={FrontQueues} />,
        });
    }
    if (!isNil(HasUnreadableBlobs)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('has-unreadable-blobs'),
            value: HasUnreadableBlobs ? vDiskInfoKeyset('yes') : vDiskInfoKeyset('no'),
        });
    }
    if (!isNil(ReadThroughput)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('read-throughput'),
            value: bytesToSpeed(ReadThroughput),
        });
    }
    if (!isNil(WriteThroughput)) {
        vdiskInfo.push({
            label: vDiskInfoKeyset('write-throughput'),
            value: bytesToSpeed(WriteThroughput),
        });
    }

    const diskParamsDefined = !isNil(PDiskId) && !isNil(NodeId) && !isNil(VDiskSlotId);

    if (diskParamsDefined) {
        const links: React.ReactNode[] = [];

        if (withVDiskPageLink) {
            const vDiskPagePath = getVDiskPagePath(VDiskSlotId, PDiskId, NodeId);
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
