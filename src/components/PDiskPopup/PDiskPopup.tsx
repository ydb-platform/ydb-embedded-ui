import React from 'react';

import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {selectNodeHostsMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {valueIsDefined} from '../../utils';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {createPDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {getPDiskId} from '../../utils/disks/helpers';
import type {PreparedPDisk} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {bytesToGB} from '../../utils/utils';
import {InfoViewer} from '../InfoViewer';
import type {InfoViewerItem} from '../InfoViewer';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';

const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];

export const preparePDiskData = (
    data: PreparedPDisk,
    nodeHost?: string,
    withDeveloperUILink?: boolean,
) => {
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

    if (withDeveloperUILink && valueIsDefined(NodeId) && valueIsDefined(PDiskId)) {
        const pDiskInternalViewerPath = createPDiskDeveloperUILink({
            nodeId: NodeId,
            pDiskId: PDiskId,
        });

        pdiskData.push({
            label: 'Links',
            value: <LinkWithIcon title={'Developer UI'} url={pDiskInternalViewerPath} />,
        });
    }

    return pdiskData;
};

interface PDiskPopupProps {
    data: PreparedPDisk;
}

export const PDiskPopup = ({data}: PDiskPopupProps) => {
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);
    const nodeHostsMap = useTypedSelector(selectNodeHostsMap);
    const nodeHost = valueIsDefined(data.NodeId) ? nodeHostsMap?.get(data.NodeId) : undefined;
    const info = React.useMemo(
        () => preparePDiskData(data, nodeHost, isUserAllowedToMakeChanges),
        [data, nodeHost, isUserAllowedToMakeChanges],
    );

    return <InfoViewer title="PDisk" info={info} size="s" />;
};
