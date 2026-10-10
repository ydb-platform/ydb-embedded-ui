import {isNil} from 'lodash';

import type {NodeMetadata} from '../../types/store/nodesList';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {getDiskLocationItems} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk} from '../../utils/disks/types';
import {formatStorageThroughput} from '../../utils/storageMetrics';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';

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

type VDiskIdentityField = 'kind' | 'guid' | 'incarnation-guid' | 'instance-guid';

export function getVDiskIdentityItems(
    data: PreparedVDisk = {},
    {copyFields = []}: {copyFields?: readonly VDiskIdentityField[]} = {},
): DiskDetailItem[] {
    const entries = [
        {id: 'kind', name: i18n('kind'), value: data.Kind},
        {id: 'guid', name: i18n('guid'), value: data.Guid},
        {id: 'incarnation-guid', name: i18n('incarnation-guid'), value: data.IncarnationGuid},
        {id: 'instance-guid', name: i18n('instance-guid'), value: data.InstanceGuid},
    ] as const;
    return entries.map(({id, name, value}) => ({
        id,
        name,
        content: isNil(value) || value === '' ? EMPTY_DATA_PLACEHOLDER : value,
        ...(copyFields.includes(id) && !isNil(value) && value !== ''
            ? {copyText: String(value)}
            : {}),
    }));
}

export function getVDiskThroughputItems(data: PreparedVDisk = {}): YDBDefinitionListItem[] {
    return (
        [
            [i18n('read-throughput'), data.ReadThroughput],
            [i18n('write-throughput'), data.WriteThroughput],
        ] as const
    ).map(([name, value]) => ({
        name,
        content: formatStorageThroughput(value),
    }));
}
