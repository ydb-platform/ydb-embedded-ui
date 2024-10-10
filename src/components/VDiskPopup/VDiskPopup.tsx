import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Label, Popup} from '@gravity-ui/uikit';

import {selectNodeHostsMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {bytesToGB, bytesToSpeed} from '../../utils/utils';
import type {InfoViewerItem} from '../InfoViewer';
import {InfoViewer} from '../InfoViewer';
import {InternalLink} from '../InternalLink';
import {preparePDiskData} from '../PDiskPopup/PDiskPopup';
import {getVDiskLink} from '../VDisk/utils';

import './VDiskPopup.scss';

const b = cn('vdisk-storage-popup');

const prepareUnavailableVDiskData = (data: UnavailableDonor) => {
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

    return vdiskData;
};

const prepareVDiskData = (data: PreparedVDisk) => {
    const {
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

    if (!Replicated) {
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

    return vdiskData;
};

interface VDiskPopupProps extends PopupProps {
    data: PreparedVDisk | UnavailableDonor;
}

export const VDiskPopup = ({data, ...props}: VDiskPopupProps) => {
    const isFullData = isFullVDiskData(data);

    const [isPopupContentHovered, setIsPopupContentHovered] = React.useState(false);
    const onMouseLeave = React.useCallback(() => {
        setIsPopupContentHovered(false);
    }, []);
    const onMouseEnter = React.useCallback(() => {
        setIsPopupContentHovered(true);
    }, []);

    const vdiskInfo = React.useMemo(
        () => (isFullData ? prepareVDiskData(data) : prepareUnavailableVDiskData(data)),
        [data, isFullData],
    );

    const nodeHostsMap = useTypedSelector(selectNodeHostsMap);
    const nodeHost = valueIsDefined(data.NodeId) ? nodeHostsMap?.get(data.NodeId) : undefined;
    const pdiskInfo = React.useMemo(
        () => isFullData && data.PDisk && preparePDiskData(data.PDisk, nodeHost),
        [data, nodeHost, isFullData],
    );

    const donorsInfo: InfoViewerItem[] = [];
    if ('Donors' in data && data.Donors) {
        const donors = data.Donors;
        for (const donor of donors) {
            const isFullDonorData = isFullVDiskData(donor);
            donorsInfo.push({
                label: 'VDisk',
                value: (
                    <InternalLink to={getVDiskLink(donor)}>
                        {stringifyVdiskId(
                            isFullDonorData
                                ? donor.VDiskId
                                : {
                                      NodeId: donor.NodeId,
                                      PDiskId: donor.PDiskId,
                                      VSlotId: donor.VSlotId,
                                  },
                        )}
                    </InternalLink>
                ),
            });
        }
    }

    return (
        <Popup
            contentClassName={b()}
            placement={['top', 'bottom']}
            hasArrow
            // bigger offset for easier switching to neighbour nodes
            // matches the default offset for popup with arrow out of a sense of beauty
            offset={[0, 12]}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            {...props}
            open={isPopupContentHovered || props.open}
        >
            {data.DonorMode && <Label className={b('donor-label')}>Donor</Label>}
            <InfoViewer title="VDisk" info={vdiskInfo} size="s" />
            {pdiskInfo && <InfoViewer title="PDisk" info={pdiskInfo} size="s" />}
            {donorsInfo.length > 0 && <InfoViewer title="Donors" info={donorsInfo} size="s" />}
        </Popup>
    );
};
