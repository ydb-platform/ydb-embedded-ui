import {isNil} from 'lodash';

import {getPDiskPagePath} from '../../routes';
import type {PreparedVDisk} from '../../utils/disks/types';
import {
    getVDiskCapacityInfoItems,
    toDefinitionListItems,
} from '../DiskCapacityInfo/DiskCapacityInfo';
import {InternalLink} from '../InternalLink';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';

import {vDiskInfoKeyset} from './i18n';

interface GetVDiskCapacityColumnsParams {
    data?: PreparedVDisk;
    isViewerUser?: boolean;
}

export function getVDiskCapacityColumns({data, isViewerUser}: GetVDiskCapacityColumnsParams): {
    leftColumn: YDBDefinitionListItem[];
    rightColumn: YDBDefinitionListItem[];
} {
    const {
        Guid,
        VDiskState,
        VDiskSlotId,
        Kind,
        IncarnationGuid,
        InstanceGuid,
        StoragePoolName,
        PDiskId,
        NodeId,
    } = data || {};
    const leftColumn: YDBDefinitionListItem[] = [];
    const rightColumn: YDBDefinitionListItem[] = [];

    if (!isNil(StoragePoolName)) {
        leftColumn.push({name: vDiskInfoKeyset('pool-name'), content: StoragePoolName});
    }
    if (!isNil(VDiskSlotId)) {
        leftColumn.push({name: vDiskInfoKeyset('slot-id'), content: VDiskSlotId});
    }
    if (!isNil(Kind)) {
        leftColumn.push({name: vDiskInfoKeyset('kind'), content: Kind});
    }

    const capacityItems = getVDiskCapacityInfoItems(data, {withRawUsage: true});
    const groupSizeItem = capacityItems.find(({id}) => id === 'group-size-in-units');
    const runtimeCapacityItems = capacityItems.filter(({id}) => id !== 'group-size-in-units');

    if (groupSizeItem) {
        leftColumn.push(...toDefinitionListItems([groupSizeItem]));
    }
    if (!isNil(Guid)) {
        leftColumn.push({name: vDiskInfoKeyset('guid'), content: Guid});
    }
    if (!isNil(IncarnationGuid)) {
        leftColumn.push({name: vDiskInfoKeyset('incarnation-guid'), content: IncarnationGuid});
    }
    if (!isNil(InstanceGuid)) {
        leftColumn.push({name: vDiskInfoKeyset('instance-guid'), content: InstanceGuid});
    }
    if (!isNil(PDiskId)) {
        const pDiskPath =
            isViewerUser && !isNil(NodeId) ? getPDiskPagePath(PDiskId, NodeId) : undefined;
        const content = pDiskPath ? <InternalLink to={pDiskPath}>{PDiskId}</InternalLink> : PDiskId;

        leftColumn.push({
            name: vDiskInfoKeyset('label_pdisk-id'),
            content,
        });
    }

    if (!isNil(VDiskState)) {
        rightColumn.push({
            name: vDiskInfoKeyset('state-status'),
            content: VDiskState,
        });
    }
    rightColumn.push(...toDefinitionListItems(runtimeCapacityItems));

    return {leftColumn, rightColumn};
}
