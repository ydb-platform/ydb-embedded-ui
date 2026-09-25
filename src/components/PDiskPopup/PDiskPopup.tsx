import React from 'react';

import {Wrench} from '@gravity-ui/icons';
import {Divider, Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {getPDiskPagePath} from '../../routes';
import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import type {NodeMetadata} from '../../types/store/nodesList';
import {BRAND_BUTTON_CLASS} from '../../utils/constants';
import {createPDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {getDiskLocationItems} from '../../utils/disks/diskInfo/getDiskLocationItems';
import type {PreparedPDisk} from '../../utils/disks/types';
import {useNodeMetadata} from '../../utils/hooks/useNodeMetadata';
import {isNumeric} from '../../utils/utils';
import {getPDiskCapacityItems} from '../DiskCapacityInfo/DiskCapacityInfo';
import {
    DiskPopup,
    DiskPopupHeader,
    DiskPopupLocation,
    DiskPopupPanel,
} from '../DiskPopup/DiskPopup';
import {DiskStatusLabel} from '../DiskStatus/DiskStatus';
import {InternalLinkButton} from '../InternalLinkButton';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {getPDiskLogItems, getPDiskRuntimeItems} from '../PDiskInfo/getPDiskDetails';
import {
    getPDiskDecommitLabel,
    getPDiskDriveLabel,
    getPDiskMaintenanceLabel,
    getPDiskStateLabel,
} from '../PDiskInfo/statuses';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import {pDiskPopupKeyset} from './i18n';

function getStorageItems(data: PreparedPDisk, capacityMetricsEnabled: boolean): DiskDetailItem[] {
    const items = getPDiskCapacityItems(data, {useWhiteboardSize: capacityMetricsEnabled}).filter(
        ({id}) =>
            capacityMetricsEnabled ||
            (id === 'space' && isNumeric(data.TotalSize) && isNumeric(data.AvailableSize)),
    );
    return [...items, ...getPDiskLogItems(data)];
}

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
    const pDiskPagePath = getPDiskPagePath(PDiskId, NodeId);

    return (
        <Flex direction="column" gap={5} alignItems="flex-start">
            {pDiskInternalViewerPath && (
                <LinkWithIcon
                    title={pDiskPopupKeyset('action_open-in-developer-ui')}
                    url={pDiskInternalViewerPath}
                    icon={Wrench}
                    hideEndIcon
                />
            )}
            <InternalLinkButton
                href={pDiskPagePath}
                view="action"
                size="m"
                className={BRAND_BUTTON_CLASS}
            >
                {pDiskPopupKeyset('action_go-to-pdisk')}
            </InternalLinkButton>
        </Flex>
    );
};

interface PDiskPopupProps {
    data: PreparedPDisk;
    nodeData?: NodeMetadata;
}

export function PDiskPopupContent({data, nodeData: parentNodeData}: PDiskPopupProps) {
    const nodeData = useNodeMetadata(data.NodeId, parentNodeData);
    const hasDeveloperUi = useHasDeveloperUi();
    const capacityMetricsEnabled = useBlobStorageCapacityMetricsEnabled();
    const storageItems = getStorageItems(data, capacityMetricsEnabled);
    const locationItems = getDiskLocationItems(data, nodeData);
    const statusLabels = [
        {id: 'state', label: getPDiskStateLabel(data.State)},
        {id: 'drive', label: getPDiskDriveLabel(data.DriveStatus)},
        {id: 'decommit', label: getPDiskDecommitLabel(data.DecommitStatus)},
        {id: 'maintenance', label: getPDiskMaintenanceLabel(data.MaintenanceStatus)},
    ];

    return (
        <DiskPopupPanel footer={buildPDiskFooter(data, hasDeveloperUi)}>
            <DiskPopupHeader
                title={pDiskPopupKeyset('label_pdisk')}
                id={data.StringifiedId}
                type={data.Type}
                statuses={statusLabels.map(({id, label}) =>
                    label ? <DiskStatusLabel key={id} {...label} size="xs" /> : null,
                )}
            />
            <DiskPopupLocation items={locationItems} title={pDiskPopupKeyset('label_pdisk')} />
            <YDBDefinitionList items={getPDiskRuntimeItems(data)} nameMaxWidth={150} />
            {storageItems.length > 0 && (
                <React.Fragment>
                    <Divider />
                    <YDBDefinitionList items={storageItems} nameMaxWidth={150} />
                </React.Fragment>
            )}
        </DiskPopupPanel>
    );
}

export function PDiskPopup(props: PDiskPopupProps) {
    return (
        <DiskPopup>
            <PDiskPopupContent {...props} />
        </DiskPopup>
    );
}
