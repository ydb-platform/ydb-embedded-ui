import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import type {NodesMap} from '../../types/store/nodesList';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {getPDiskId} from '../../utils/dataFormatters/dataFormatters';
import type {PreparedPDisk} from '../../utils/disks/types';
import {bytesToGB} from '../../utils/utils';
import type {InfoViewerItem} from '../InfoViewer';
import {InfoViewer} from '../InfoViewer';

import './PDiskPopup.scss';

const b = cn('pdisk-storage-popup');

const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];

export const preparePDiskData = (data: PreparedPDisk, nodes?: NodesMap) => {
    const {AvailableSize, TotalSize, State, PDiskId, NodeId, Path, Realtime, Type, Device} = data;

    const pdiskData: InfoViewerItem[] = [
        {label: 'PDisk', value: getPDiskId({NodeId, PDiskId}) || EMPTY_DATA_PLACEHOLDER},
        {label: 'State', value: State || 'not available'},
        {label: 'Type', value: Type || 'unknown'},
    ];

    if (NodeId) {
        pdiskData.push({label: 'Node Id', value: NodeId});
    }

    if (nodes && NodeId && nodes.get(NodeId)) {
        pdiskData.push({label: 'Host', value: nodes.get(NodeId)});
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
    data: PreparedPDisk;
    nodes?: NodesMap;
}

export const PDiskPopup = ({data, nodes, ...props}: PDiskPopupProps) => {
    const info = React.useMemo(() => preparePDiskData(data, nodes), [data, nodes]);

    return (
        <Popup
            contentClassName={b()}
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
