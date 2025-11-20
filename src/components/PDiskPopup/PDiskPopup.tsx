import React from 'react';

import {Flex, Label} from '@gravity-ui/uikit';

import {selectNodesMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {createPDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {getStateSeverity} from '../../utils/disks/calculatePDiskSeverity';
import {
    NUMERIC_SEVERITY_LABEL_ICON,
    NUMERIC_SEVERITY_LABEL_THEME,
} from '../../utils/disks/constants';
import type {PreparedPDisk} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {bytesToGB, isNumeric} from '../../utils/utils';
import {InfoViewer} from '../InfoViewer';
import type {InfoViewerHeaderLabel, InfoViewerItem} from '../InfoViewer';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {pDiskInfoKeyset} from '../PDiskInfo/i18n';
import {PDiskPageLink} from '../PDiskPageLink/PDiskPageLink';

import {pDiskPopupKeyset} from './i18n';

import './PDiskPopup.scss';

const b = cn('pdisk-storage-popup');

const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];

export const preparePDiskData = (
    data: PreparedPDisk,
    nodeData?: {Host?: string; DC?: string},
    withDeveloperUILink?: boolean,
) => {
    const {AvailableSize, TotalSize, PDiskId, NodeId, Path, Realtime, Type, Device} = data;

    const pdiskData: InfoViewerItem[] = [
        {label: pDiskPopupKeyset('label_type'), value: Type || pDiskPopupKeyset('value_unknown')},
    ];

    if (NodeId) {
        pdiskData.push({label: pDiskPopupKeyset('label_node-id'), value: NodeId});
    }

    if (nodeData?.Host) {
        pdiskData.push({label: pDiskPopupKeyset('label_host'), value: nodeData.Host});
    }

    if (nodeData?.DC) {
        pdiskData.push({label: pDiskPopupKeyset('label_dc'), value: <Label>{nodeData.DC}</Label>});
    }

    if (Path) {
        pdiskData.push({label: pDiskPopupKeyset('label_path'), value: Path});
    }

    if (isNumeric(TotalSize)) {
        pdiskData.push({
            label: pDiskPopupKeyset('label_available'),
            value: `${bytesToGB(AvailableSize)} ${pDiskPopupKeyset('value_of')} ${bytesToGB(TotalSize)}`,
        });
    }

    if (Realtime && errorColors.includes(Realtime)) {
        pdiskData.push({label: pDiskPopupKeyset('label_realtime'), value: Realtime});
    }

    if (Device && errorColors.includes(Device)) {
        pdiskData.push({label: pDiskPopupKeyset('label_device'), value: Device});
    }

    if (withDeveloperUILink && valueIsDefined(NodeId) && valueIsDefined(PDiskId)) {
        const pDiskInternalViewerPath = createPDiskDeveloperUILink({
            nodeId: NodeId,
            pDiskId: PDiskId,
        });

        pdiskData.push({
            label: null,
            value: (
                <Flex className={b('links')} gap={2} wrap="wrap">
                    <PDiskPageLink pDiskId={PDiskId} nodeId={NodeId} />
                    <LinkWithIcon
                        title={pDiskInfoKeyset('developer-ui')}
                        url={pDiskInternalViewerPath}
                    />
                </Flex>
            ),
        });
    }

    return pdiskData;
};

export const preparePDiskHeaderLabels = (data: PreparedPDisk): InfoViewerHeaderLabel[] => {
    const labels: InfoViewerHeaderLabel[] = [];
    const {State} = data;

    if (!State) {
        labels.push({
            value: pDiskPopupKeyset('context_not-available'),
        });

        return labels;
    }

    const severity = getStateSeverity(State);
    const theme = severity !== undefined ? NUMERIC_SEVERITY_LABEL_THEME[severity] : undefined;
    const icon = severity !== undefined ? NUMERIC_SEVERITY_LABEL_ICON[severity] : undefined;

    labels.push({
        value: State,
        theme,
        icon,
    });

    return labels;
};

interface PDiskPopupProps {
    data: PreparedPDisk;
}

export const PDiskPopup = ({data}: PDiskPopupProps) => {
    const database = useDatabaseFromQuery();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const nodesMap = useTypedSelector((state) => selectNodesMap(state, database));
    const nodeData = valueIsDefined(data.NodeId) ? nodesMap?.get(data.NodeId) : undefined;

    const info = React.useMemo(
        () => preparePDiskData(data, nodeData, isUserAllowedToMakeChanges),
        [data, nodeData, isUserAllowedToMakeChanges],
    );

    const headerLabels = React.useMemo<InfoViewerHeaderLabel[]>(
        () => preparePDiskHeaderLabels(data),
        [data],
    );

    const pdiskId = data.StringifiedId;

    return (
        <InfoViewer
            title="PDisk"
            titleSuffix={pdiskId ?? EMPTY_DATA_PLACEHOLDER}
            info={info}
            size="s"
            headerLabels={headerLabels}
        />
    );
};
