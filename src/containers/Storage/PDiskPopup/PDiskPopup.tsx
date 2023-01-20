import {useMemo} from 'react';
import cn from 'bem-cn-lite';

import {Popup, PopupProps} from '@gravity-ui/uikit';

import {InfoViewer, InfoViewerItem} from '../../../components/InfoViewer';

import {EFlag} from '../../../types/api/enums';
import {TPDiskStateInfo} from '../../../types/api/pdisk';
import {getPDiskId} from '../../../utils';
import {getPDiskType} from '../../../utils/pdisk';
import {bytesToGB} from '../../../utils/utils';

import './PDiskPopup.scss';

const b = cn('pdisk-storage-popup');

const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];

const preparePDiskData = (data: TPDiskStateInfo) => {
    const {AvailableSize, TotalSize, State, PDiskId, NodeId, Path, Realtime, Device} = data;

    const pdiskData: InfoViewerItem[] = [
        {label: 'PDisk', value: getPDiskId({NodeId, PDiskId})},
        {label: 'State', value: State || 'not available'},
        {label: 'Type', value: getPDiskType(data) || 'unknown'},
    ];

    if (NodeId) {
        pdiskData.push({label: 'Node Id', value: NodeId});
    }

    if (Path) {
        pdiskData.push({label: 'Path', value: Path});
    }

    pdiskData.push({
        label: 'Available',
        value: `${bytesToGB(AvailableSize)} of ${bytesToGB(TotalSize)}`,
    });

    if (Realtime && errorColors.includes(Realtime)) {
        pdiskData.push({label: 'Realtime', value: Realtime});
    }

    if (Device && errorColors.includes(Device)) {
        pdiskData.push({label: 'Device', value: Device});
    }

    return pdiskData;
};

interface PDiskPopupProps extends PopupProps {
    data: TPDiskStateInfo;
}

export const PDiskPopup = ({data, ...props}: PDiskPopupProps) => {
    const info = useMemo(() => preparePDiskData(data), [data]);

    return (
        <Popup
            className={b()}
            placement={['top', 'bottom']}
            // bigger offset for easier switching to neighbour nodes
            // matches the default offset for popup with arrow out of a sense of beauty
            offset={[0, 12]}
            {...props}
        >
            <InfoViewer title="PDisk" info={info} size="s" />
        </Popup>
    );
};
