import type {NbsDirectBlockGroup, NbsDisk} from '../../../types/api/nbs';

export function diskKey(id: NbsDisk['DiskId']) {
    return `${id.NodeId}:${id.PDiskId}:${id.DDiskSlotId}`;
}

export function isAllocated(id: NbsDisk['DiskId']) {
    return Boolean(id.NodeId || id.PDiskId);
}

export function prepareTabletGroups(groups: NbsDirectBlockGroup[], disks: NbsDisk[]) {
    const byDisk = new Map(disks.map((disk) => [diskKey(disk.DiskId), disk]));
    return groups.map((group) => {
        const unavailable = (ids: NbsDisk['DiskId'][] = []) =>
            ids.filter((id) => isAllocated(id) && byDisk.get(diskKey(id))?.Available === false)
                .length;
        return {
            ...group,
            Degrade: Math.max(
                unavailable(group.DDiskId),
                unavailable(group.PersistentBufferDDiskId),
            ),
        };
    });
}

export async function getTabletGroups(tabletId: string, signal: AbortSignal) {
    const snapshot = await window.api.storage.getNbsTablet(tabletId, {signal});
    const disks: NbsDisk[] = [];
    let total: number;
    do {
        const page = await window.api.storage.getNbsStorage(
            'disks',
            {
                filter_tablet_id: tabletId,
                include_tablet_ids: false,
                offset: disks.length,
                limit: 100,
            },
            {signal},
        );
        const rows = page.Disks ?? [];
        disks.push(...rows);
        total = page.TotalCount ?? disks.length;
        if (!rows.length) {
            break;
        }
    } while (disks.length < total);
    return {groups: prepareTabletGroups(snapshot.Groups ?? [], disks), disks};
}
