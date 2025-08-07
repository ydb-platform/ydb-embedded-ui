import React from 'react';

import {Flex, Label} from '@gravity-ui/uikit';

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
import {getVDiskLink} from '../VDisk/utils';
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
            label: vDiskPopupKeyset('label_links'),
            value: <LinkWithIcon title={'Developer UI'} url={vDiskInternalViewerPath} />,
        });
    }

    return vdiskData;
};

// eslint-disable-next-line complexity
const prepareVDiskData = (
    data: PreparedVDisk,
    withDeveloperUILink: boolean | undefined,
    query: {database: string | undefined},
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
        VDiskId,
    } = data;

    const vdiskData: InfoViewerItem[] = [
        {label: vDiskPopupKeyset('label_vdisk'), value: StringifiedId},
        {
            label: vDiskPopupKeyset('label_state'),
            value: VDiskState ?? vDiskPopupKeyset('context_not-available'),
        },
    ];

    if (StoragePoolName) {
        vdiskData.push({label: vDiskPopupKeyset('label_storage-pool'), value: StoragePoolName});
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

        const vDiskPagePath = getVDiskLink(
            {VDiskSlotId, PDiskId, NodeId, StringifiedId, VDiskId},
            query,
        );
        if (vDiskPagePath) {
            vdiskData.push({
                label: vDiskPopupKeyset('label_links'),
                value: (
                    <Flex wrap="wrap" gap={2}>
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

    const database = useDatabaseFromQuery();

    const vdiskInfo = React.useMemo(
        () =>
            isFullData
                ? prepareVDiskData(data, isUserAllowedToMakeChanges, {database})
                : prepareUnavailableVDiskData(data, isUserAllowedToMakeChanges),
        [data, isFullData, isUserAllowedToMakeChanges, database],
    );

    const nodesMap = useTypedSelector(selectNodesMap);
    const nodeData = valueIsDefined(data.NodeId) ? nodesMap?.get(data.NodeId) : undefined;
    const pdiskInfo = React.useMemo(
        () =>
            isFullData &&
            data.PDisk &&
            preparePDiskData(data.PDisk, nodeData, isUserAllowedToMakeChanges),
        [data, nodeData, isFullData, isUserAllowedToMakeChanges],
    );

    const donorsInfo: InfoViewerItem[] = [];
    if ('Donors' in data && data.Donors) {
        const donors = data.Donors;
        for (const donor of donors) {
            donorsInfo.push({
                label: vDiskPopupKeyset('label_vdisk'),
                value: (
                    <InternalLink to={getVDiskLink(donor, {database})}>
                        {donor.StringifiedId}
                    </InternalLink>
                ),
            });
        }
    }

    return (
        <div className={b()}>
            {data.DonorMode && <Label className={b('donor-label')}>Donor</Label>}
            <InfoViewer title="VDisk" info={vdiskInfo} size="s" />
            {pdiskInfo && isViewerUser && <InfoViewer title="PDisk" info={pdiskInfo} size="s" />}
            {donorsInfo.length > 0 && <InfoViewer title="Donors" info={donorsInfo} size="s" />}
        </div>
    );
};
