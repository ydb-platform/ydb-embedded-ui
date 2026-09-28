import {isNil} from 'lodash';

import type {NodeMetadata} from '../../types/store/nodesList';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {getDiskLocationItems} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk} from '../../utils/disks/types';

import {vDiskInfoKeyset as i18n} from './i18n';

export function getVDiskLocationItems(
    data: PreparedVDisk,
    nodeData: NodeMetadata,
): DiskDetailItem[] {
    const fullData = isFullVDiskData(data) ? data : undefined;
    return getDiskLocationItems(
        {
            NodeId: data.NodeId,
            PDiskId: data.PDiskId,
            Path: fullData?.PDiskPath ?? fullData?.PDisk?.Path,
            VDiskSlotId: data.VDiskSlotId,
        },
        nodeData,
        {withVDiskSlotId: true},
    );
}

export function getVDiskIdentityItems(data: PreparedVDisk = {}): DiskDetailItem[] {
    const entries = [
        {id: 'kind', name: i18n('kind'), value: data.Kind},
        {id: 'guid', name: i18n('guid'), value: data.Guid},
        {id: 'incarnation-guid', name: i18n('incarnation-guid'), value: data.IncarnationGuid},
        {id: 'instance-guid', name: i18n('instance-guid'), value: data.InstanceGuid},
    ];
    return entries.flatMap(({id, name, value}) =>
        isNil(value) || value === '' ? [] : [{id, name, content: value}],
    );
}
