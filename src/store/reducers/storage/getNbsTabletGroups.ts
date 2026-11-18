import type {TDDiskStateInfo} from '../../../types/api/ddisk';
import type {NbsDisk} from '../../../types/api/nbs';

export function diskKey(id: Pick<TDDiskStateInfo, 'NodeId' | 'PDiskId' | 'DDiskSlotId'>) {
    return `${id.NodeId}:${id.PDiskId}:${id.DDiskSlotId}`;
}

export function isAllocated(id: NbsDisk['DiskId']) {
    return Boolean(id.NodeId || id.PDiskId);
}

export async function getTabletGroups(tabletId: string, signal: AbortSignal) {
    const snapshot = await window.api.storage.getNbsTablet(tabletId, {signal});
    return {groups: snapshot.Groups ?? [], slots: snapshot.Slots ?? []};
}
