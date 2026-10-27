import {isNil} from 'lodash';

import type {YDBDefinitionListItem} from '../../../components/YDBDefinitionList/YDBDefinitionList';
import type {NodeMetadata} from '../../../types/store/nodesList';
import {EMPTY_DATA_PLACEHOLDER} from '../../constants';

import i18n from './i18n';

export interface DiskDetailItem extends YDBDefinitionListItem {
    /** Stable field identifier for ordering and grouping independently of translated names. */
    id: string;
}

interface DiskLocationData {
    NodeId?: number;
    PDiskId?: number;
    Path?: string;
    VDiskSlotId?: number;
}

export function getDiskLocationItems(
    data: DiskLocationData,
    nodeData: NodeMetadata,
    {withVDiskSlotId = false}: {withVDiskSlotId?: boolean} = {},
): DiskDetailItem[] {
    const entries = [
        {id: 'fqdn', name: i18n('field_fqdn'), value: nodeData.Host},
        {id: 'rack', name: i18n('field_rack'), value: nodeData.Rack},
        {id: 'datacenter', name: i18n('field_datacenter'), value: nodeData.DC},
        {id: 'pdisk-path', name: i18n('field_pdisk-path'), value: data.Path},
        {id: 'node-id', name: i18n('field_node-id'), value: data.NodeId || undefined},
        {id: 'pdisk-id', name: i18n('field_pdisk-id'), value: data.PDiskId},
    ];
    if (withVDiskSlotId) {
        entries.push({
            id: 'vdisk-slot-id',
            name: i18n('field_vdisk-slot-id'),
            value: data.VDiskSlotId,
        });
    }
    return entries.map(({id, name, value}) => {
        const missing = isNil(value) || value === '';
        return {
            id,
            name,
            content: missing ? EMPTY_DATA_PLACEHOLDER : value,
            copyText: missing ? undefined : value,
        };
    });
}
