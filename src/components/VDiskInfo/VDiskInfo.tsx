import React from 'react';

import {Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {getPDiskPagePath, useVDiskPagePath} from '../../routes';
import {EVDiskState} from '../../types/api/vdisk';
import {cn} from '../../utils/cn';
import {
    formatStorageValuesToGb,
    formatUptimeInSeconds,
} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {getSeverityColor} from '../../utils/disks/helpers';
import type {PreparedVDisk} from '../../utils/disks/types';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {bytesToSpeed} from '../../utils/utils';
import {InfoViewer} from '../InfoViewer';
import {InternalLink} from '../InternalLink';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {StatusIcon} from '../StatusIcon/StatusIcon';

import {vDiskInfoKeyset} from './i18n';

import './VDiskInfo.scss';

const b = cn('ydb-vdisk-info');

interface VDiskInfoProps<T extends PreparedVDisk> {
    data?: T;
    withVDiskPageLink?: boolean;
    withTitle?: boolean;
    className?: string;
    wrap?: true;
}

// eslint-disable-next-line complexity
export function VDiskInfo<T extends PreparedVDisk>({
    data,
    withVDiskPageLink,
    withTitle,
    className,
    wrap,
}: VDiskInfoProps<T>) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const getVDiskPagePath = useVDiskPagePath();

    const {
        AllocatedSize,
        SizeLimit,
        AllocatedPercent,
        DiskSpace,
        FrontQueues,
        Guid,
        Replicated,
        ReplicationProgress,
        ReplicationSecondsRemaining,
        Donors,
        VDiskState,
        VDiskSlotId,
        Kind,
        SatisfactionRank,
        HasUnreadableBlobs,
        IncarnationGuid,
        InstanceGuid,
        StoragePoolName,
        ReadThroughput,
        WriteThroughput,
        PDiskId,
        StringifiedId,
        NodeId,
    } = data || {};

    const leftColumn = [];

    if (!isNil(StoragePoolName)) {
        leftColumn.push({label: vDiskInfoKeyset('pool-name'), value: StoragePoolName});
    }
    if (!isNil(VDiskState)) {
        leftColumn.push({
            label: vDiskInfoKeyset('state-status'),
            value: VDiskState,
        });
    }

    if (Number(AllocatedSize) >= 0 && Number(SizeLimit) >= 0) {
        leftColumn.push({
            label: vDiskInfoKeyset('size'),
            value: (
                <ProgressViewer
                    value={AllocatedSize}
                    capacity={SizeLimit}
                    formatValues={formatStorageValuesToGb}
                    colorizeProgress={true}
                />
            ),
        });
    }
    if (!isNaN(Number(AllocatedPercent))) {
        leftColumn.push({
            label: vDiskInfoKeyset('usage'),
            value: `${AllocatedPercent}%`,
        });
    }

    if (!isNil(DiskSpace)) {
        leftColumn.push({
            label: vDiskInfoKeyset('space-status'),
            value: <StatusIcon status={DiskSpace} />,
        });
    }
    if (!isNil(FrontQueues)) {
        leftColumn.push({
            label: vDiskInfoKeyset('front-queues'),
            value: <StatusIcon status={FrontQueues} />,
        });
    }
    if (!isNil(SatisfactionRank?.FreshRank?.Flag)) {
        leftColumn.push({
            label: vDiskInfoKeyset('fresh-rank-satisfaction'),
            value: <StatusIcon status={SatisfactionRank?.FreshRank?.Flag} />,
        });
    }
    if (!isNil(SatisfactionRank?.LevelRank?.Flag)) {
        leftColumn.push({
            label: vDiskInfoKeyset('level-rank-satisfaction'),
            value: <StatusIcon status={SatisfactionRank?.LevelRank?.Flag} />,
        });
    }
    if (!isNil(ReadThroughput)) {
        leftColumn.push({
            label: vDiskInfoKeyset('read-throughput'),
            value: bytesToSpeed(ReadThroughput),
        });
    }
    if (!isNil(WriteThroughput)) {
        leftColumn.push({
            label: vDiskInfoKeyset('write-throughput'),
            value: bytesToSpeed(WriteThroughput),
        });
    }

    const rightColumn = [];

    if (!isNil(Replicated)) {
        rightColumn.push({
            label: vDiskInfoKeyset('replication-status'),
            value: Replicated ? vDiskInfoKeyset('yes') : vDiskInfoKeyset('no'),
        });
    }
    // Only show replication progress and time remaining when disk is not replicated and state is OK
    if (Replicated === false && VDiskState === EVDiskState.OK) {
        if (!isNil(ReplicationProgress)) {
            rightColumn.push({
                label: vDiskInfoKeyset('replication-progress'),
                value: (
                    <ProgressViewer
                        value={Math.round(ReplicationProgress * 100)}
                        percents
                        colorizeProgress={true}
                        capacity={100}
                    />
                ),
            });
        }
        if (!isNil(ReplicationSecondsRemaining)) {
            const timeRemaining = formatUptimeInSeconds(ReplicationSecondsRemaining);
            if (timeRemaining) {
                rightColumn.push({
                    label: vDiskInfoKeyset('replication-time-remaining'),
                    value: timeRemaining,
                });
            }
        }
    }
    if (!isNil(VDiskSlotId)) {
        rightColumn.push({label: vDiskInfoKeyset('slot-id'), value: VDiskSlotId});
    }
    if (!isNil(PDiskId)) {
        const pDiskPath = isNil(NodeId) ? undefined : getPDiskPagePath(PDiskId, NodeId);

        const value = pDiskPath ? <InternalLink to={pDiskPath}>{PDiskId}</InternalLink> : PDiskId;

        rightColumn.push({
            label: vDiskInfoKeyset('label_pdisk-id'),
            value,
        });
    }

    if (!isNil(Kind)) {
        rightColumn.push({label: vDiskInfoKeyset('kind'), value: Kind});
    }
    if (!isNil(Guid)) {
        rightColumn.push({label: vDiskInfoKeyset('guid'), value: Guid});
    }
    if (!isNil(IncarnationGuid)) {
        rightColumn.push({label: vDiskInfoKeyset('incarnation-guid'), value: IncarnationGuid});
    }
    if (!isNil(InstanceGuid)) {
        rightColumn.push({label: vDiskInfoKeyset('instance-guid'), value: InstanceGuid});
    }
    if (!isNil(HasUnreadableBlobs)) {
        rightColumn.push({
            label: vDiskInfoKeyset('has-unreadable-blobs'),
            value: HasUnreadableBlobs ? vDiskInfoKeyset('yes') : vDiskInfoKeyset('no'),
        });
    }

    // Show donors list when replication is in progress
    if (Replicated === false && VDiskState === EVDiskState.OK && Donors?.length) {
        const donorLinks = Donors.map((donor, index) => {
            const {StringifiedId: id, NodeId: dNodeId} = donor;

            if (!id || !dNodeId) {
                return null;
            }

            const vDiskPath = getVDiskPagePath({
                nodeId: dNodeId,
                vDiskId: id,
            });

            return (
                <InternalLink key={index} to={vDiskPath}>
                    {id}
                </InternalLink>
            );
        }).filter(Boolean);

        if (donorLinks.length) {
            rightColumn.push({
                label: vDiskInfoKeyset('donors'),
                value: (
                    <Flex direction="column" gap={1}>
                        {donorLinks}
                    </Flex>
                ),
            });
        }
    }
    const links: React.ReactNode[] = [];
    const vDiskPagePath = getVDiskPagePath({
        nodeId: NodeId,
        vDiskId: StringifiedId,
    });
    if (withVDiskPageLink && vDiskPagePath) {
        links.push(
            <LinkWithIcon
                key={vDiskPagePath}
                title={vDiskInfoKeyset('vdisk-page')}
                url={vDiskPagePath}
                external={false}
            />,
        );
    }

    if (isUserAllowedToMakeChanges && !isNil(NodeId) && !isNil(VDiskSlotId) && !isNil(PDiskId)) {
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
        rightColumn.push({
            label: vDiskInfoKeyset('links'),
            value: (
                <Flex wrap="wrap" gap={2}>
                    {links}
                </Flex>
            ),
        });
    }

    const title = data && withTitle ? <VDiskTitle data={data} /> : null;

    // Component is used both on vdisk page and in popups
    // Display in two columns on page (row + wrap) and in one column in popups (column + nowrap)
    return (
        <Flex className={className} gap={2} direction={wrap ? 'row' : 'column'} wrap={wrap}>
            <InfoViewer
                title={title}
                info={leftColumn}
                renderEmptyState={() => null}
                className={b('info')}
            />
            <InfoViewer info={rightColumn} renderEmptyState={() => null} className={b('info')} />
        </Flex>
    );
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
