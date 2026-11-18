import {uiFactory} from '../../uiFactory/uiFactory';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

export function OperationUser({userId, clusterName}: {userId?: string; clusterName?: string}) {
    if (!userId) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return uiFactory.resolveUser?.({userId, clusterName}) ?? userId;
}
