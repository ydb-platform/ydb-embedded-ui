import React from 'react';

import {Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {getPDiskPagePath, useVDiskPagePath} from '../../routes';
import {EVDiskState} from '../../types/api/vdisk';
import {cn} from '../../utils/cn';
import {
    formatDurationSeconds,
    formatStorageValuesToGb,
} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {getSeverityColor} from '../../utils/disks/helpers';
import type {PreparedVDisk} from '../../utils/disks/types';
import {bytesToSpeed} from '../../utils/utils';
import {InternalLink} from '../InternalLink';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {StatusIcon} from '../StatusIcon/StatusIcon';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

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
    const hasDeveloperUi = useHasDeveloperUi();

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
        Recipient,
    } = data || {};

    const leftColumn: YDBDefinitionListItem[] = [];

    if (!isNil(StoragePoolName)) {
        leftColumn.push({name: vDiskInfoKeyset('pool-name'), content: StoragePoolName});
    }
    if (!isNil(VDiskState)) {
        leftColumn.push({
            name: vDiskInfoKeyset('state-status'),
            content: VDiskState,
        });
    }

    if (Number(AllocatedSize) >= 0 && Number(SizeLimit) >= 0) {
        leftColumn.push({
            name: vDiskInfoKeyset('size'),
            content: (
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
            name: vDiskInfoKeyset('usage'),
            content: `${AllocatedPercent}%`,
        });
    }

    if (!isNil(DiskSpace)) {
        leftColumn.push({
            name: vDiskInfoKeyset('space-status'),
            content: <StatusIcon status={DiskSpace} />,
        });
    }
    if (!isNil(FrontQueues)) {
        leftColumn.push({
            name: vDiskInfoKeyset('front-queues'),
            content: <StatusIcon status={FrontQueues} />,
        });
    }
    if (!isNil(SatisfactionRank?.FreshRank?.Flag)) {
        leftColumn.push({
            name: vDiskInfoKeyset('fresh-rank-satisfaction'),
            content: <StatusIcon status={SatisfactionRank?.FreshRank?.Flag} />,
        });
    }
    if (!isNil(SatisfactionRank?.LevelRank?.Flag)) {
        leftColumn.push({
            name: vDiskInfoKeyset('level-rank-satisfaction'),
            content: <StatusIcon status={SatisfactionRank?.LevelRank?.Flag} />,
        });
    }
    if (!isNil(ReadThroughput)) {
        leftColumn.push({
            name: vDiskInfoKeyset('read-throughput'),
            content: bytesToSpeed(ReadThroughput),
        });
    }
    if (!isNil(WriteThroughput)) {
        leftColumn.push({
            name: vDiskInfoKeyset('write-throughput'),
            content: bytesToSpeed(WriteThroughput),
        });
    }

    const rightColumn: YDBDefinitionListItem[] = [];

    if (!isNil(Replicated)) {
        rightColumn.push({
            name: vDiskInfoKeyset('replication-status'),
            content: Replicated ? vDiskInfoKeyset('yes') : vDiskInfoKeyset('no'),
        });
    }
    // Only show replication progress and time remaining when disk is not replicated and state is OK
    if (Replicated === false && VDiskState === EVDiskState.OK) {
        if (!isNil(ReplicationProgress)) {
            rightColumn.push({
                name: vDiskInfoKeyset('replication-progress'),
                content: (
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
            const timeRemaining = formatDurationSeconds(ReplicationSecondsRemaining);
            if (timeRemaining) {
                rightColumn.push({
                    name: vDiskInfoKeyset('replication-time-remaining'),
                    content: timeRemaining,
                });
            }
        }
    }
    if (!isNil(VDiskSlotId)) {
        rightColumn.push({name: vDiskInfoKeyset('slot-id'), content: VDiskSlotId});
    }
    if (!isNil(PDiskId)) {
        const pDiskPath = isNil(NodeId) ? undefined : getPDiskPagePath(PDiskId, NodeId);

        const content = pDiskPath ? <InternalLink to={pDiskPath}>{PDiskId}</InternalLink> : PDiskId;

        rightColumn.push({
            name: vDiskInfoKeyset('label_pdisk-id'),
            content,
        });
    }

    if (!isNil(Kind)) {
        rightColumn.push({name: vDiskInfoKeyset('kind'), content: Kind});
    }
    if (!isNil(Guid)) {
        rightColumn.push({name: vDiskInfoKeyset('guid'), content: Guid});
    }
    if (!isNil(IncarnationGuid)) {
        rightColumn.push({name: vDiskInfoKeyset('incarnation-guid'), content: IncarnationGuid});
    }
    if (!isNil(InstanceGuid)) {
        rightColumn.push({name: vDiskInfoKeyset('instance-guid'), content: InstanceGuid});
    }
    if (!isNil(HasUnreadableBlobs)) {
        rightColumn.push({
            name: vDiskInfoKeyset('has-unreadable-blobs'),
            content: HasUnreadableBlobs ? vDiskInfoKeyset('yes') : vDiskInfoKeyset('no'),
        });
    }
    if (!isNil(Recipient) && !isNil(Recipient.StringifiedId)) {
        const recipientPath = getVDiskPagePath({
            nodeId: Recipient.NodeId,
            vDiskId: Recipient.StringifiedId,
        });
        rightColumn.push({
            name: vDiskInfoKeyset('label_recipient'),
            content: recipientPath ? (
                <InternalLink to={recipientPath}>{Recipient.StringifiedId}</InternalLink>
            ) : (
                Recipient.StringifiedId
            ),
        });
    }

    // Show donors list when replication is in progress
    if (Replicated === false && Donors?.length) {
        const donorLinks = Donors.map((donor, index) => {
            const {StringifiedId: id, NodeId: dNodeId} = donor;

            if (!id) {
                return null;
            }

            const vDiskPath = getVDiskPagePath({
                nodeId: dNodeId,
                vDiskId: id,
            });

            return vDiskPath ? (
                <InternalLink key={index} to={vDiskPath}>
                    {id}
                </InternalLink>
            ) : null;
        }).filter(Boolean);

        if (donorLinks.length) {
            rightColumn.push({
                name: vDiskInfoKeyset('donors'),
                content: (
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

    if (hasDeveloperUi && !isNil(NodeId) && !isNil(VDiskSlotId) && !isNil(PDiskId)) {
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
            name: vDiskInfoKeyset('links'),
            content: (
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
            {leftColumn.length > 0 && (
                <YDBDefinitionList title={title} items={leftColumn} wrapperClassName={b('info')} />
            )}
            {rightColumn.length > 0 && (
                <YDBDefinitionList items={rightColumn} wrapperClassName={b('info')} />
            )}
        </Flex>
    );
}

interface VDiskTitleProps<T extends PreparedVDisk> {
    data: T;
}

function VDiskTitle<T extends PreparedVDisk>({data}: VDiskTitleProps<T>) {
    return (
        <Flex gap={2} alignItems="center">
            {vDiskInfoKeyset('vdiks-title')}
            <StatusIcon status={getSeverityColor(data.Severity)} />
            {data.StringifiedId}
        </Flex>
    );
}
