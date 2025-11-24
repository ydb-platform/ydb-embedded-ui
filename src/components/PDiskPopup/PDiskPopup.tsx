import React from 'react';

import {Flex, Label} from '@gravity-ui/uikit';

import {selectNodesMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {TPDiskState} from '../../types/api/pdisk';
import {valueIsDefined} from '../../utils';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {createPDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {getPlaceholderTextByFlag, getSeverityColor} from '../../utils/disks/helpers';
import type {PreparedPDisk} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {bytesToGB, isNumeric} from '../../utils/utils';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {pDiskInfoKeyset} from '../PDiskInfo/i18n';
import {PDiskPageLink} from '../PDiskPageLink/PDiskPageLink';
import type {
    YDBDefinitionListHeaderLabel,
    YDBDefinitionListItem,
} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import {pDiskPopupKeyset} from './i18n';

const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];

export const preparePDiskData = (data: PreparedPDisk, nodeData?: {Host?: string; DC?: string}) => {
    const {AvailableSize, TotalSize, NodeId, Path, Realtime, Type, Device} = data;

    const pdiskData: YDBDefinitionListItem[] = [
        {name: pDiskPopupKeyset('label_type'), content: Type || pDiskPopupKeyset('value_unknown')},
    ];

    if (NodeId) {
        pdiskData.push({name: pDiskPopupKeyset('label_node-id'), content: NodeId});
    }

    if (nodeData?.Host) {
        pdiskData.push({name: pDiskPopupKeyset('label_host'), content: nodeData.Host});
    }

    if (nodeData?.DC) {
        pdiskData.push({name: pDiskPopupKeyset('label_dc'), content: <Label>{nodeData.DC}</Label>});
    }

    if (Path) {
        pdiskData.push({name: pDiskPopupKeyset('label_path'), content: Path});
    }

    if (isNumeric(TotalSize)) {
        pdiskData.push({
            name: pDiskPopupKeyset('label_available'),
            content: `${bytesToGB(AvailableSize)} ${pDiskPopupKeyset('value_of')} ${bytesToGB(TotalSize)}`,
        });
    }

    if (Realtime && errorColors.includes(Realtime)) {
        pdiskData.push({name: pDiskPopupKeyset('label_realtime'), content: Realtime});
    }

    if (Device && errorColors.includes(Device)) {
        pdiskData.push({name: pDiskPopupKeyset('label_device'), content: Device});
    }

    return pdiskData;
};

export const preparePDiskHeaderLabels = (data: PreparedPDisk): YDBDefinitionListHeaderLabel[] => {
    const labels: YDBDefinitionListHeaderLabel[] = [];
    const {State, Severity} = data;

    if (!State) {
        labels.push({
            id: 'state',
            value: pDiskPopupKeyset('context_not-available'),
        });

        return labels;
    }

    const stateStatus = getSeverityColor(Severity);

    const hasError = State && State !== TPDiskState.Normal;
    const value = hasError ? State : getPlaceholderTextByFlag(Severity);

    labels.push({
        id: 'state',
        value,
        status: stateStatus,
    });

    return labels;
};

export const buildPDiskFooter = (
    data: PreparedPDisk,
    withDeveloperUILink?: boolean,
): React.ReactNode | null => {
    const {NodeId, PDiskId} = data;

    if (!withDeveloperUILink || !valueIsDefined(NodeId) || !valueIsDefined(PDiskId)) {
        return null;
    }

    const pDiskInternalViewerPath = createPDiskDeveloperUILink({
        nodeId: NodeId,
        pDiskId: PDiskId,
    });

    return (
        <Flex gap={2} wrap="wrap">
            <PDiskPageLink pDiskId={PDiskId} nodeId={NodeId} />
            <LinkWithIcon title={pDiskInfoKeyset('developer-ui')} url={pDiskInternalViewerPath} />
        </Flex>
    );
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
        () => preparePDiskData(data, nodeData),
        [data, nodeData, isUserAllowedToMakeChanges],
    );

    const headerLabels = React.useMemo<YDBDefinitionListHeaderLabel[]>(
        () => preparePDiskHeaderLabels(data),
        [data],
    );

    const footer = React.useMemo(
        () => buildPDiskFooter(data, isUserAllowedToMakeChanges),
        [data, isUserAllowedToMakeChanges],
    );

    const pdiskId = data.StringifiedId;

    return (
        <YDBDefinitionList
            compact
            title="PDisk"
            titleSuffix={pdiskId ?? EMPTY_DATA_PLACEHOLDER}
            items={info}
            headerLabels={headerLabels}
            footer={footer}
            nameMaxWidth={100}
        />
    );
};
