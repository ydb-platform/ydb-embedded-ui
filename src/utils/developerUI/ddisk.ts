import type {TDDiskStateInfo} from '../../types/api/ddisk';
import {pad9} from '../utils';

import {createDeveloperUILinkWithNodeId} from './developerUI';

export function getDDiskDeveloperUIHrefs(data: TDDiskStateInfo) {
    const base =
        data.NodeId === undefined ? undefined : createDeveloperUILinkWithNodeId(data.NodeId);
    const ddiskPath =
        data.DDiskPath ||
        (data.PDiskId !== undefined && data.DDiskSlotId !== undefined
            ? `actors/ddisks/ddisk_p${pad9(data.PDiskId)}_s${pad9(data.DDiskSlotId)}`
            : undefined);
    const query = new URLSearchParams({
        formPresent: '1',
        autoRefresh: '1',
        describeFreeSpace: '1',
        refreshRate: '1',
        pb: data.PersistentBufferId ?? '',
    });
    if (data.PersistentBufferId) {
        query.set(`tabletOpen.${data.PersistentBufferId}`, '1');
    }
    return {
        ddisk: base && ddiskPath ? `${base}/${ddiskPath}` : undefined,
        buffer:
            base && data.PersistentBufferId
                ? `${base}/actors/persistent_buffer?${query}`
                : undefined,
    };
}
