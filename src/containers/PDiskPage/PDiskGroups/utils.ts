import type {PreparedStorageResponse} from '../../../store/reducers/storage/types';

export function preparePDiskStorageResponse(
    data?: PreparedStorageResponse,
    pDiskId?: number | string,
    nodeId?: number | string,
) {
    return data?.groups?.filter((group) => {
        return group.VDisks?.some((vdisk) => {
            // If VDisk has PDisk inside, PDiskId and NodeId fields could be only inside PDisk and vice versa
            const groupPDiskId = vdisk.PDiskId ?? vdisk.PDisk?.PDiskId;
            const groupNodeId = vdisk.NodeId ?? vdisk.PDisk?.NodeId;

            return (
                Number(groupPDiskId) === Number(pDiskId) && Number(groupNodeId) === Number(nodeId)
            );
        });
    });
}
