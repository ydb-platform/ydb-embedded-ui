import {isNil} from 'lodash';

import type {NodeMetadata} from '../../types/store/nodesList';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';

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
): DiskDetailItem[] {
    const entries = [
        {id: 'fqdn', name: i18n('field_fqdn'), value: nodeData.Host},
        {id: 'rack', name: i18n('field_rack'), value: nodeData.Rack},
        {id: 'datacenter', name: i18n('field_datacenter'), value: nodeData.DC},
        {id: 'pdisk-path', name: i18n('field_pdisk-path'), value: data.Path},
        {id: 'node-id', name: i18n('field_node-id'), value: data.NodeId},
        {id: 'pdisk-id', name: i18n('field_pdisk-id'), value: data.PDiskId},
        {id: 'vdisk-slot-id', name: i18n('field_vdisk-slot-id'), value: data.VDiskSlotId},
    ];
    return entries.flatMap(({id, name, value}) =>
        isNil(value) || value === '' ? [] : [{id, name, content: value, copyText: value}],
    );
}
