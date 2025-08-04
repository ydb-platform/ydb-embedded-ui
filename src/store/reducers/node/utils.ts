import type {TEvSystemStateResponse} from '../../../types/api/systemState';
import {prepareNodeSystemState} from '../../../utils/nodes';

import type {PreparedNode} from './types';

export const prepareNodeData = (data: TEvSystemStateResponse): PreparedNode => {
    if (!data.SystemStateInfo?.length) {
        return {};
    }

    const nodeData = data.SystemStateInfo[0];

    return prepareNodeSystemState(nodeData);
};
