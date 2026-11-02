import {Check} from '@gravity-ui/icons';
import type {LabelProps} from '@gravity-ui/uikit';

import {DiskStatusLabel} from '../../components/DiskStatus/DiskStatus';
import type {TStorageGroupStateInfo} from '../../types/api/storage';

import {getStorageGroupStateLabel} from './utils/getStorageGroupStateLabel';

export function StorageGroupStateLabel({
    state,
    stateInfo,
    size = 's',
}: {state?: string; stateInfo?: TStorageGroupStateInfo} & Pick<LabelProps, 'size'>) {
    const label = getStorageGroupStateLabel(state, stateInfo);

    return label ? (
        <DiskStatusLabel
            {...label}
            size={size}
            iconSize={size === 'xs' ? 12 : 14}
            icon={label.theme === 'success' ? Check : undefined}
        />
    ) : null;
}
