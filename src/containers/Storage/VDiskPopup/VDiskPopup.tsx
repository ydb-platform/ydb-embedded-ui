import {useMemo} from 'react';
import cn from 'bem-cn-lite';

import {Label, Popup, PopupProps} from '@gravity-ui/uikit';

import {InfoViewer, InfoViewerItem} from '../../../components/InfoViewer';

import {EFlag} from '../../../types/api/enums';
import {TVDiskStateInfo} from '../../../types/api/vdisk';
import {stringifyVdiskId} from '../../../utils';
import {bytesToGB, bytesToSpeed} from '../../../utils/utils';

import {NodesHosts, preparePDiskData} from '../PDiskPopup';

import './VDiskPopup.scss';

const b = cn('vdisk-storage-popup');

const prepareVDiskData = (data: TVDiskStateInfo, poolName?: string) => {
    const {
        VDiskId,
        VDiskState,
        SatisfactionRank,
        DiskSpace,
        FrontQueues,
        Replicated,
        UnsyncedVDisks,
        AllocatedSize,
        ReadThroughput,
        WriteThroughput,
    } = data;

    const vdiskData: InfoViewerItem[] = [
        {label: 'VDisk', value: stringifyVdiskId(VDiskId)},
        {label: 'State', value: VDiskState ?? 'not available'},
    ];

    if (poolName) {
        vdiskData.push({label: 'StoragePool', value: poolName});
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
    data: TVDiskStateInfo;
    poolName?: string;
    nodes?: NodesHosts;
}

export const VDiskPopup = ({data, poolName, nodes, ...props}: VDiskPopupProps) => {
    const vdiskInfo = useMemo(() => prepareVDiskData(data, poolName), [data, poolName]);
    const pdiskInfo = useMemo(
        () => data.PDisk && preparePDiskData(data.PDisk, nodes),
        [data.PDisk, nodes],
    );

    return (
        <Popup
            className={b()}
            placement={['top', 'bottom']}
            // bigger offset for easier switching to neighbour nodes
            // matches the default offset for popup with arrow out of a sense of beauty
            offset={[0, 12]}
            {...props}
        >
            {data.DonorMode && <Label className={b('donor-label')}>Donor</Label>}
            <InfoViewer title="VDisk" info={vdiskInfo} size="s" />
            {pdiskInfo && <InfoViewer title="PDisk" info={pdiskInfo} size="s" />}
        </Popup>
    );
};
