import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';

import {selectNodeHostsMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {getPDiskId} from '../../utils/disks/helpers';
import type {PreparedPDisk} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {bytesToGB} from '../../utils/utils';
import type {InfoViewerItem} from '../InfoViewer';
import {InfoViewer} from '../InfoViewer';

import './PDiskPopup.scss';

const b = cn('pdisk-storage-popup');

const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];

export const preparePDiskData = (data: PreparedPDisk, nodeHost?: string) => {
    const {AvailableSize, TotalSize, State, PDiskId, NodeId, Path, Realtime, Type, Device} = data;

    const pdiskData: InfoViewerItem[] = [
        {
            label: 'PDisk',
            value: getPDiskId(NodeId, PDiskId) ?? EMPTY_DATA_PLACEHOLDER,
        },
        {label: 'State', value: State || 'not available'},
        {label: 'Type', value: Type || 'unknown'},
    ];

    if (NodeId) {
        pdiskData.push({label: 'Node Id', value: NodeId});
    }

    if (nodeHost) {
        pdiskData.push({label: 'Host', value: nodeHost});
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
}

export const PDiskPopup = ({data, ...props}: PDiskPopupProps) => {
    const nodeHostsMap = useTypedSelector(selectNodeHostsMap);
    const nodeHost = valueIsDefined(data.NodeId) ? nodeHostsMap?.get(data.NodeId) : undefined;
    const info = React.useMemo(() => preparePDiskData(data, nodeHost), [data, nodeHost]);

    const [isPopupContentHovered, setIsPopupContentHovered] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const onMouseLeave = React.useCallback(() => {
        setIsPopupContentHovered(false);
    }, []);

    const onMouseEnter = React.useCallback(() => {
        setIsPopupContentHovered(true);
    }, []);

    const onContextMenu = React.useCallback(() => {
        setIsFocused(true);
    }, []);

    const onBlur = React.useCallback(() => {
        setIsFocused(false);
    }, []);

    return (
        <Popup
            contentClassName={b()}
            placement={['top', 'bottom']}
            hasArrow
            // bigger offset for easier switching to neighbour nodes
            // matches the default offset for popup with arrow out of a sense of beauty
            offset={[0, 12]}
            onMouseLeave={onMouseLeave}
            onMouseEnter={onMouseEnter}
            onBlur={onBlur}
            {...props}
            open={isPopupContentHovered || props.open || isFocused}
        >
            <div onContextMenu={onContextMenu}>
                <InfoViewer title="PDisk" info={info} size="s" />
            </div>
        </Popup>
    );
};
