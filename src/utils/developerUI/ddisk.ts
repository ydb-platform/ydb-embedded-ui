import type {TDDiskStateInfo} from '../../types/api/ddisk';

import {createDeveloperUILinkWithNodeId} from './developerUI';

export function getDDiskDeveloperUIHrefs(data: TDDiskStateInfo) {
    const base =
        data.NodeId === undefined ? undefined : createDeveloperUILinkWithNodeId(data.NodeId);
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
        ddisk: base && data.DDiskPath ? `${base}/${data.DDiskPath}` : undefined,
        buffer:
            base && data.PersistentBufferId
                ? `${base}/actors/persistent_buffer?${query}`
                : undefined,
    };
}
