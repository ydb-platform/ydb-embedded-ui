import type {PreparedStorageResponse} from '../../store/reducers/storage/types';

export function prepareVDiskGroupResponse(
    data?: PreparedStorageResponse,
    groupId?: string | number,
) {
    return data?.groups?.find((group) => {
        return Number(group.GroupId) === Number(groupId);
    });
}
