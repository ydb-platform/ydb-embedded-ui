import React from 'react';

import {ArrowsRotateLeft, BucketPaint} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex} from '@gravity-ui/uikit';

import {useVDiskPagePath} from '../../routes';
import {selectNodesMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {EVDiskState} from '../../types/api/vdisk';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatUptimeInSeconds} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {
    useIsUserAllowedToMakeChanges,
    useIsViewerUser,
} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {bytesToGB, bytesToSpeed} from '../../utils/utils';
import type {InfoViewerItem} from '../InfoViewer';
import {InfoViewer} from '../InfoViewer';
import {InternalLink} from '../InternalLink';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {preparePDiskData} from '../PDiskPopup/PDiskPopup';
import {vDiskInfoKeyset} from '../VDiskInfo/i18n';

import {vDiskPopupKeyset} from './i18n';

import './VDiskPopup.scss';

const b = cn('vdisk-storage-popup');

const prepareUnavailableVDiskData = (data: UnavailableDonor, withDeveloperUILink?: boolean) => {
    const {NodeId, PDiskId, VSlotId, StoragePoolName} = data;

    const vdiskData: InfoViewerItem[] = [
        {label: vDiskPopupKeyset('label_state'), value: vDiskPopupKeyset('context_not-available')},
    ];

    if (StoragePoolName) {
        vdiskData.push({label: vDiskPopupKeyset('label_storage-pool'), value: StoragePoolName});
    }

    vdiskData.push(
        {label: vDiskPopupKeyset('label_node-id'), value: NodeId ?? EMPTY_DATA_PLACEHOLDER},
        {label: vDiskPopupKeyset('label_pdisk-id'), value: PDiskId ?? EMPTY_DATA_PLACEHOLDER},
        {label: vDiskPopupKeyset('label_vslot-id'), value: VSlotId ?? EMPTY_DATA_PLACEHOLDER},
    );

    if (
        withDeveloperUILink &&
        valueIsDefined(NodeId) &&
        valueIsDefined(PDiskId) &&
        valueIsDefined(VSlotId)
    ) {
        const vDiskInternalViewerPath = createVDiskDeveloperUILink({
            nodeId: NodeId,
            pDiskId: PDiskId,
            vDiskSlotId: VSlotId,
        });

        vdiskData.push({
            label: null,
            value: (
                <div className={b('links')}>
                    <LinkWithIcon title={'Developer UI'} url={vDiskInternalViewerPath} />
                </div>
            ),
        });
    }

    return vdiskData;
};

// eslint-disable-next-line complexity
const prepareVDiskData = (
    data: PreparedVDisk,
    withDeveloperUILink: boolean | undefined,
    getVDiskLinkFn?: (data: {
        nodeId: string | number;
        vDiskId: string | undefined;
    }) => string | undefined,
) => {
    const {
        NodeId,
        PDiskId,
        VDiskSlotId,
        StringifiedId,
        VDiskState,
        SatisfactionRank,
        DiskSpace,
        FrontQueues,
        Replicated,
        ReplicationProgress,
        ReplicationSecondsRemaining,
        UnsyncedVDisks,
        AllocatedSize,
        ReadThroughput,
        WriteThroughput,
        StoragePoolName,
        Donors,
        DonorMode,
        Recipient,
    } = data;

    const vdiskData: InfoViewerItem[] = [
        {
            label: vDiskPopupKeyset('label_state'),
            value: VDiskState ?? vDiskPopupKeyset('context_not-available'),
        },
    ];

    if (StoragePoolName) {
        vdiskData.push({label: vDiskPopupKeyset('label_storage-pool'), value: StoragePoolName});
    }

    if (Donors?.length && getVDiskLinkFn) {
        vdiskData.push({
            label: vDiskPopupKeyset('label_donors'),
            value: (
                <Flex direction="column">
                    {Donors.map((donor) => {
                        if (!valueIsDefined(donor.NodeId) || !valueIsDefined(donor.StringifiedId)) {
                            return (
                                <div key={donor.StringifiedId}>
                                    {donor.StringifiedId ?? EMPTY_DATA_PLACEHOLDER}
                                </div>
                            );
                        }

                        return (
                            <InternalLink
                                key={donor.StringifiedId}
                                to={getVDiskLinkFn({
                                    nodeId: donor.NodeId,
                                    vDiskId: donor.StringifiedId,
                                })}
                            >
                                {vDiskPopupKeyset('label_vdisk')} {donor.StringifiedId}
                            </InternalLink>
                        );
                    })}
                </Flex>
            ),
        });
    }

    if (DonorMode && Recipient && getVDiskLinkFn) {
        let recipientContent: React.ReactNode;

        if (valueIsDefined(Recipient.NodeId) && valueIsDefined(Recipient.StringifiedId)) {
            const recipientPath = getVDiskLinkFn({
                nodeId: Recipient.NodeId,
                vDiskId: Recipient.StringifiedId,
            });

            recipientContent = recipientPath ? (
                <InternalLink to={recipientPath}>
                    {vDiskPopupKeyset('label_vdisk')} {Recipient.StringifiedId}
                </InternalLink>
            ) : (
                <div>{Recipient.StringifiedId}</div>
            );
        }

        vdiskData.push({
            label: vDiskPopupKeyset('label_recipient'),
            value: recipientContent,
        });
    }

    if (SatisfactionRank && SatisfactionRank.FreshRank?.Flag !== EFlag.Green) {
        vdiskData.push({
            label: vDiskPopupKeyset('label_fresh'),
            value: SatisfactionRank.FreshRank?.Flag,
        });
    }

    if (SatisfactionRank && SatisfactionRank.LevelRank?.Flag !== EFlag.Green) {
        vdiskData.push({
            label: vDiskPopupKeyset('label_level'),
            value: SatisfactionRank.LevelRank?.Flag,
        });
    }

    if (SatisfactionRank && SatisfactionRank.FreshRank?.RankPercent) {
        vdiskData.push({
            label: vDiskPopupKeyset('label_fresh'),
            value: SatisfactionRank.FreshRank.RankPercent,
        });
    }

    if (SatisfactionRank && SatisfactionRank.LevelRank?.RankPercent) {
        vdiskData.push({
            label: vDiskPopupKeyset('label_level'),
            value: SatisfactionRank.LevelRank.RankPercent,
        });
    }

    if (DiskSpace && DiskSpace !== EFlag.Green) {
        vdiskData.push({label: vDiskPopupKeyset('label_space'), value: DiskSpace});
    }

    if (FrontQueues && FrontQueues !== EFlag.Green) {
        vdiskData.push({label: vDiskPopupKeyset('label_front-queues'), value: FrontQueues});
    }

    if (Replicated === false && VDiskState === EVDiskState.OK) {
        vdiskData.push({label: vDiskPopupKeyset('label_replicated'), value: 'NO'});

        // Only show replication progress and time remaining when disk is not replicated and state is OK
        if (valueIsDefined(ReplicationProgress)) {
            const progressPercent = Math.round(ReplicationProgress * 100);
            vdiskData.push({
                label: vDiskPopupKeyset('label_progress'),
                value: `${progressPercent}%`,
            });
        }

        if (valueIsDefined(ReplicationSecondsRemaining)) {
            const timeRemaining = formatUptimeInSeconds(ReplicationSecondsRemaining);
            if (timeRemaining) {
                vdiskData.push({
                    label: vDiskPopupKeyset('label_remaining'),
                    value: timeRemaining,
                });
            }
        }
    }

    if (UnsyncedVDisks) {
        vdiskData.push({label: vDiskPopupKeyset('label_unsync-vdisks'), value: UnsyncedVDisks});
    }

    if (Number(AllocatedSize)) {
        vdiskData.push({
            label: vDiskPopupKeyset('label_allocated'),
            value: bytesToGB(AllocatedSize),
        });
    }

    if (Number(ReadThroughput)) {
        vdiskData.push({
            label: vDiskPopupKeyset('label_read'),
            value: bytesToSpeed(ReadThroughput),
        });
    }

    if (Number(WriteThroughput)) {
        vdiskData.push({
            label: vDiskPopupKeyset('label_write'),
            value: bytesToSpeed(WriteThroughput),
        });
    }

    if (
        withDeveloperUILink &&
        valueIsDefined(NodeId) &&
        valueIsDefined(PDiskId) &&
        (valueIsDefined(VDiskSlotId) || valueIsDefined(StringifiedId))
    ) {
        const vDiskInternalViewerPath = valueIsDefined(VDiskSlotId)
            ? createVDiskDeveloperUILink({
                  nodeId: NodeId,
                  pDiskId: PDiskId,
                  vDiskSlotId: VDiskSlotId,
              })
            : undefined;

        const vDiskPagePath = getVDiskLinkFn?.({nodeId: NodeId, vDiskId: StringifiedId});
        if (vDiskPagePath) {
            vdiskData.push({
                label: null,
                value: (
                    <Flex className={b('links')} wrap="wrap" gap={2}>
                        <LinkWithIcon
                            key={vDiskPagePath}
                            title={vDiskInfoKeyset('vdisk-page')}
                            url={vDiskPagePath}
                            external={false}
                        />
                        {vDiskInternalViewerPath ? (
                            <LinkWithIcon
                                title={vDiskInfoKeyset('developer-ui')}
                                url={vDiskInternalViewerPath}
                            />
                        ) : null}
                    </Flex>
                ),
            });
        }
    }

    return vdiskData;
};

interface VDiskPopupProps {
    data: PreparedVDisk | UnavailableDonor;
}

export const VDiskPopup = ({data}: VDiskPopupProps) => {
    const isFullData = isFullVDiskData(data);
    const isViewerUser = useIsViewerUser();

    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const getVDiskLink = useVDiskPagePath();

    const database = useDatabaseFromQuery();

    const vdiskInfo = React.useMemo(
        () =>
            isFullData
                ? prepareVDiskData(data, isUserAllowedToMakeChanges, getVDiskLink)
                : prepareUnavailableVDiskData(data, isUserAllowedToMakeChanges),
        [data, isFullData, isUserAllowedToMakeChanges, getVDiskLink],
    );

    const nodesMap = useTypedSelector((state) => selectNodesMap(state, database));
    const nodeData = valueIsDefined(data.NodeId) ? nodesMap?.get(data.NodeId) : undefined;
    const pdiskInfo = React.useMemo(
        () =>
            isFullData &&
            data.PDisk &&
            preparePDiskData(data.PDisk, nodeData, isUserAllowedToMakeChanges),
        [data, nodeData, isFullData, isUserAllowedToMakeChanges],
    );

    const vdiskId = isFullVDiskData(data) ? data.StringifiedId : undefined;

    const labelConfig: {
        showLabel: boolean;
        labelText?: string;
        labelIcon?: IconData;
        labelTheme?: LabelProps['theme'];
    } = {
        showLabel: false,
    };

    if (data.DonorMode) {
        labelConfig.showLabel = true;
        labelConfig.labelText = vDiskPopupKeyset('label_donor');
        labelConfig.labelIcon = BucketPaint;
        labelConfig.labelTheme = 'unknown';
    } else if (isFullVDiskData(data) && !data.Replicated) {
        labelConfig.showLabel = true;
        labelConfig.labelText = vDiskPopupKeyset('label_replication');
        labelConfig.labelIcon = ArrowsRotateLeft;
        labelConfig.labelTheme = 'info';
    }

    return (
        <div className={b()}>
            <InfoViewer
                title="VDisk"
                titleSuffix={vdiskId ?? EMPTY_DATA_PLACEHOLDER}
                info={vdiskInfo}
                size="s"
                showLabel={labelConfig.showLabel}
                labelText={labelConfig.labelText}
                labelTheme={labelConfig.labelTheme}
                labelIcon={labelConfig.labelIcon}
            />
            {pdiskInfo && isViewerUser && <InfoViewer title="PDisk" info={pdiskInfo} size="s" />}
        </div>
    );
};
