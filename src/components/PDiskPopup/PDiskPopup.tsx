import React from 'react';

import {Flex, Label} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {selectNodesMap} from '../../store/reducers/nodesList';
import {EFlag} from '../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {createPDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {getStateSeverity} from '../../utils/disks/calculatePDiskSeverity';
import {NUMERIC_SEVERITY_TO_LABEL_VIEW} from '../../utils/disks/constants';
import type {PreparedPDisk} from '../../utils/disks/types';
import {useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {bytesToGB, isNumeric} from '../../utils/utils';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {pDiskInfoKeyset} from '../PDiskInfo/i18n';
import {PDiskPageLink} from '../PDiskPageLink/PDiskPageLink';
import {StatusIcon} from '../StatusIcon/StatusIcon';
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

    if (isNumeric(TotalSize) && isNumeric(AvailableSize)) {
        pdiskData.push({
            name: pDiskPopupKeyset('label_available'),
            content: `${bytesToGB(AvailableSize)} ${pDiskPopupKeyset('value_of')} ${bytesToGB(TotalSize)}`,
        });
    }

    if (Realtime && errorColors.includes(Realtime)) {
        pdiskData.push({
            name: pDiskPopupKeyset('label_realtime'),
            content: <StatusIcon mode="icons" status={Realtime} />,
        });
    }

    if (Device && errorColors.includes(Device)) {
        pdiskData.push({
            name: pDiskPopupKeyset('label_device'),
            content: <StatusIcon mode="icons" status={Device} />,
        });
    }

    return pdiskData;
};

export const preparePDiskHeaderLabels = (data: PreparedPDisk): YDBDefinitionListHeaderLabel[] => {
    const labels: YDBDefinitionListHeaderLabel[] = [];
    const {State} = data;

    if (!State) {
        labels.push({
            id: 'state',
            value: pDiskPopupKeyset('context_not-available'),
        });

        return labels;
    }

    if (State) {
        const severity = getStateSeverity(State);
        const {theme, icon} = NUMERIC_SEVERITY_TO_LABEL_VIEW[severity];

        labels.push({
            id: 'state',
            value: State,
            theme: theme,
            icon: icon,
        });
    }

    return labels;
};

export const buildPDiskFooter = (
    data: PreparedPDisk,
    withDeveloperUILink?: boolean,
): React.ReactNode | null => {
    const {NodeId, PDiskId} = data;

    if (isNil(NodeId) || isNil(PDiskId)) {
        return null;
    }

    const pDiskInternalViewerPath = withDeveloperUILink
        ? createPDiskDeveloperUILink({
              nodeId: NodeId,
              pDiskId: PDiskId,
          })
        : undefined;

    return (
        <Flex gap={2} wrap="wrap">
            <PDiskPageLink pDiskId={PDiskId} nodeId={NodeId} />
            {pDiskInternalViewerPath && (
                <LinkWithIcon
                    title={pDiskInfoKeyset('developer-ui')}
                    url={pDiskInternalViewerPath}
                />
            )}
        </Flex>
    );
};

interface PDiskPopupProps {
    data: PreparedPDisk;
}

export const PDiskPopup = ({data}: PDiskPopupProps) => {
    const database = useDatabaseFromQuery();
    const hasDeveloperUi = useHasDeveloperUi();
    const nodesMap = useTypedSelector((state) => selectNodesMap(state, database));
    const nodeData = isNil(data.NodeId) ? undefined : nodesMap?.get(data.NodeId);

    const info = React.useMemo(() => preparePDiskData(data, nodeData), [data, nodeData]);

    const headerLabels = React.useMemo<YDBDefinitionListHeaderLabel[]>(
        () => preparePDiskHeaderLabels(data),
        [data],
    );

    const footer = React.useMemo(
        () => buildPDiskFooter(data, hasDeveloperUi),
        [data, hasDeveloperUi],
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
