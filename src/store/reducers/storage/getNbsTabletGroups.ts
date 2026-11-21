import type {
    NbsDirectBlockGroup,
    NbsGroupMemberId,
    NbsMonitoredQuorum,
    NbsTabletSlot,
} from '../../../types/api/nbs';

type TabletSlots = Partial<Record<string, NbsTabletSlot>>;

interface GroupMembers {
    ids: NbsGroupMemberId[];
    ready: number;
    unavailable: number;
    unknown: number;
}

export interface NbsTabletGroup
    extends Pick<NbsDirectBlockGroup, 'DirectBlockGroupId' | 'NumVChunksClaimed'> {
    disks: GroupMembers;
    buffers: GroupMembers;
    quorum: NbsMonitoredQuorum;
}

const LEGACY_REQUIRED_READY_MEMBERS = 3;

export function diskKey(id: NbsGroupMemberId) {
    return `${id.NodeId ?? 0}:${id.PDiskId ?? 0}:${id.DDiskSlotId ?? 0}`;
}

function countMembers(
    ids: NbsGroupMemberId[] | undefined,
    slots: TabletSlots,
    statusField: 'DDiskStatus' | 'PersistentBufferStatus',
): GroupMembers {
    const members: GroupMembers = {ids: [], ready: 0, unavailable: 0, unknown: 0};
    for (const id of ids ?? []) {
        if (!id.NodeId && !id.PDiskId) {
            continue;
        }
        members.ids.push(id);
        const status = slots[diskKey(id)]?.[statusField];
        if (status === undefined) {
            members.unknown++;
        } else if (status === 'Ready') {
            members.ready++;
        } else {
            members.unavailable++;
        }
    }
    return members;
}

function estimateQuorum(
    disks: GroupMembers,
    buffers: GroupMembers,
    requiredReady: number,
): NbsMonitoredQuorum {
    if (
        disks.ready + disks.unknown < requiredReady ||
        buffers.ready + buffers.unknown < requiredReady
    ) {
        return 'NoQuorum';
    }
    if (disks.ready >= requiredReady && buffers.ready >= requiredReady) {
        return 'Quorum';
    }
    return 'Unknown';
}

export async function getTabletGroups(tabletId: string, signal: AbortSignal) {
    const snapshot = await window.api.storage.getNbsTablet(tabletId, {signal});
    const slots: TabletSlots = Object.fromEntries(
        (snapshot.Slots ?? []).map((slot) => [diskKey(slot), slot]),
    );
    const requiredReady = snapshot.RequiredReadyMembers ?? LEGACY_REQUIRED_READY_MEMBERS;
    const groups = (snapshot.Groups ?? []).map((group): NbsTabletGroup => {
        const disks = countMembers(group.DDiskId, slots, 'DDiskStatus');
        const buffers = countMembers(
            group.PersistentBufferDDiskId,
            slots,
            'PersistentBufferStatus',
        );
        return {
            DirectBlockGroupId: group.DirectBlockGroupId,
            NumVChunksClaimed: group.NumVChunksClaimed,
            disks,
            buffers,
            quorum: estimateQuorum(disks, buffers, requiredReady),
        };
    });
    return {groups, slots};
}
