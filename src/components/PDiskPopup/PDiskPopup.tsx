import React from 'react';

import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {selectNodesMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {valueIsDefined} from '../../utils';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {createPDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import type {PreparedPDisk} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {bytesToGB, isNumeric} from '../../utils/utils';
import {InfoViewer} from '../InfoViewer';
import type {InfoViewerItem} from '../InfoViewer';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';

const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];

export const preparePDiskData = (
    data: PreparedPDisk,
    nodeData?: {Host?: string; DC?: string},
    withDeveloperUILink?: boolean,
) => {
    const {
        AvailableSize,
        TotalSize,
        State,
        PDiskId,
        NodeId,
        StringifiedId,
        Path,
        Realtime,
        Type,
        Device,
    } = data;

    const pdiskData: InfoViewerItem[] = [
        {
            label: 'PDisk',
            value: StringifiedId ?? EMPTY_DATA_PLACEHOLDER,
        },
        {label: 'State', value: State || 'not available'},
        {label: 'Type', value: Type || 'unknown'},
    ];

    if (NodeId) {
        pdiskData.push({label: 'Node Id', value: NodeId});
    }

    if (nodeData?.Host) {
        pdiskData.push({label: 'Host', value: nodeData.Host});
    }
    if (nodeData?.DC) {
        pdiskData.push({label: 'DC', value: nodeData.DC});
    }

    if (Path) {
        pdiskData.push({label: 'Path', value: Path});
    }

    if (isNumeric(TotalSize)) {
        pdiskData.push({
            label: 'Available',
            value: `${bytesToGB(AvailableSize)} of ${bytesToGB(TotalSize)}`,
        });
    }

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
    const nodesMap = useTypedSelector(selectNodesMap);
    const nodeData = valueIsDefined(data.NodeId) ? nodesMap?.get(data.NodeId) : undefined;
    const info = React.useMemo(
        () => preparePDiskData(data, nodeData, isUserAllowedToMakeChanges),
        [data, nodeData, isUserAllowedToMakeChanges],
    );

    return <InfoViewer title="PDisk" info={info} size="s" />;
};
