import React from 'react';

import {Label} from '@gravity-ui/uikit';

import {selectNodesMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {createVDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {bytesToGB, bytesToSpeed} from '../../utils/utils';
import type {InfoViewerItem} from '../InfoViewer';
import {InfoViewer} from '../InfoViewer';
import {InternalLink} from '../InternalLink';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {preparePDiskData} from '../PDiskPopup/PDiskPopup';
import {getVDiskLink} from '../VDisk/utils';

import './VDiskPopup.scss';

const b = cn('vdisk-storage-popup');

const prepareUnavailableVDiskData = (
    data: UnavailableDonor,
    withDeveloperUILink?: boolean,
    database?: string,
) => {
    const {NodeId, PDiskId, VSlotId, StoragePoolName} = data;

    const vdiskData: InfoViewerItem[] = [{label: 'State', value: 'not available'}];

    if (StoragePoolName) {
        vdiskData.push({label: 'StoragePool', value: StoragePoolName});
    }

    vdiskData.push(
        {label: 'NodeId', value: NodeId ?? EMPTY_DATA_PLACEHOLDER},
        {label: 'PDiskId', value: PDiskId ?? EMPTY_DATA_PLACEHOLDER},
        {label: 'VSlotId', value: VSlotId ?? EMPTY_DATA_PLACEHOLDER},
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
            database,
        });

        vdiskData.push({
            label: 'Links',
            value: <LinkWithIcon title={'Developer UI'} url={vDiskInternalViewerPath} />,
        });
    }

    return vdiskData;
};

// eslint-disable-next-line complexity
const prepareVDiskData = (
    data: PreparedVDisk,
    withDeveloperUILink?: boolean,
    database?: string,
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
        UnsyncedVDisks,
        AllocatedSize,
        ReadThroughput,
        WriteThroughput,
        StoragePoolName,
    } = data;

    const vdiskData: InfoViewerItem[] = [
        {label: 'VDisk', value: StringifiedId},
        {label: 'State', value: VDiskState ?? 'not available'},
    ];

    if (StoragePoolName) {
        vdiskData.push({label: 'StoragePool', value: StoragePoolName});
    }

    if (SatisfactionRank && SatisfactionRank.FreshRank?.Flag !== EFlag.Green) {
        vdiskData.push({
            label: 'Fresh',
            value: SatisfactionRank.FreshRank?.Flag,
        });
    }

    if (SatisfactionRank && SatisfactionRank.LevelRank?.Flag !== EFlag.Green) {
        vdiskData.push({
            label: 'Level',
            value: SatisfactionRank.LevelRank?.Flag,
        });
    }

    if (SatisfactionRank && SatisfactionRank.FreshRank?.RankPercent) {
        vdiskData.push({
            label: 'Fresh',
            value: SatisfactionRank.FreshRank.RankPercent,
        });
    }

    if (SatisfactionRank && SatisfactionRank.LevelRank?.RankPercent) {
        vdiskData.push({
            label: 'Level',
            value: SatisfactionRank.LevelRank.RankPercent,
        });
    }

    if (DiskSpace && DiskSpace !== EFlag.Green) {
        vdiskData.push({label: 'Space', value: DiskSpace});
    }

    if (FrontQueues && FrontQueues !== EFlag.Green) {
        vdiskData.push({label: 'FrontQueues', value: FrontQueues});
    }

    if (Replicated === false) {
        vdiskData.push({label: 'Replicated', value: 'NO'});
    }

    if (UnsyncedVDisks) {
        vdiskData.push({label: 'UnsyncVDisks', value: UnsyncedVDisks});
    }

    if (Number(AllocatedSize)) {
        vdiskData.push({
            label: 'Allocated',
            value: bytesToGB(AllocatedSize),
        });
    }

    if (Number(ReadThroughput)) {
        vdiskData.push({label: 'Read', value: bytesToSpeed(ReadThroughput)});
    }

    if (Number(WriteThroughput)) {
        vdiskData.push({
            label: 'Write',
            value: bytesToSpeed(WriteThroughput),
        });
    }

    if (
        withDeveloperUILink &&
        valueIsDefined(NodeId) &&
        valueIsDefined(PDiskId) &&
        valueIsDefined(VDiskSlotId)
    ) {
        const vDiskInternalViewerPath = createVDiskDeveloperUILink({
            nodeId: NodeId,
            pDiskId: PDiskId,
            vDiskSlotId: VDiskSlotId,
            database,
        });

        vdiskData.push({
            label: 'Links',
            value: <LinkWithIcon title={'Developer UI'} url={vDiskInternalViewerPath} />,
        });
    }

    return vdiskData;
};

interface VDiskPopupProps {
    data: PreparedVDisk | UnavailableDonor;
}

export const VDiskPopup = ({data}: VDiskPopupProps) => {
    const database = useDatabaseFromQuery();
    const isFullData = isFullVDiskData(data);

    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const vdiskInfo = React.useMemo(
        () =>
            isFullData
                ? prepareVDiskData(data, isUserAllowedToMakeChanges, database)
                : prepareUnavailableVDiskData(data, isUserAllowedToMakeChanges, database),
        [data, isFullData, isUserAllowedToMakeChanges, database],
    );

    const nodesMap = useTypedSelector(selectNodesMap);
    const nodeData = valueIsDefined(data.NodeId) ? nodesMap?.get(data.NodeId) : undefined;
    const pdiskInfo = React.useMemo(
        () =>
            isFullData &&
            data.PDisk &&
            preparePDiskData(data.PDisk, nodeData, isUserAllowedToMakeChanges, database),
        [data, nodeData, isFullData, isUserAllowedToMakeChanges, database],
    );

    const donorsInfo: InfoViewerItem[] = [];
    if ('Donors' in data && data.Donors) {
        const donors = data.Donors;
        for (const donor of donors) {
            donorsInfo.push({
                label: 'VDisk',
                value: (
                    <InternalLink to={getVDiskLink(donor, database)}>
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
            {pdiskInfo && <InfoViewer title="PDisk" info={pdiskInfo} size="s" />}
            {donorsInfo.length > 0 && <InfoViewer title="Donors" info={donorsInfo} size="s" />}
        </div>
    );
};
