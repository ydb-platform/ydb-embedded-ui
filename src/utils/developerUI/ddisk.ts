import type {TDDiskStateInfo} from '../../types/api/ddisk';

import {createDeveloperUILinkWithNodeId} from './developerUI';

export function getDDiskDeveloperUIHrefs(data: TDDiskStateInfo) {
    const base =
        data.NodeId === undefined ? undefined : createDeveloperUILinkWithNodeId(data.NodeId);
    const query = new URLSearchParams({
        formPresent: '1',
        autoRefresh: '1',
        describeFreeSpace: '1',
        showTablets: '1',
        refreshRate: '1',
        pb: data.PersistentBufferId ?? '',
    });
    return {
        ddisk: base && data.DDiskPath ? `${base}/${data.DDiskPath}` : undefined,
        buffer:
            base && data.PersistentBufferId
                ? `${base}/actors/persistent_buffer?${query}`
                : undefined,
    };
}
