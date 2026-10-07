import {Check} from '@gravity-ui/icons';
import type {LabelProps} from '@gravity-ui/uikit';

import {DiskStatusLabel} from '../../components/DiskStatus/DiskStatus';

import {getStorageGroupStateLabel} from './utils/getStorageGroupStateLabel';

export function StorageGroupStateLabel({
    state,
    size = 's',
}: {state?: string} & Pick<LabelProps, 'size'>) {
    const label = getStorageGroupStateLabel(state);

    return label ? (
        <DiskStatusLabel
            {...label}
            size={size}
            iconSize={size === 'xs' ? 12 : 14}
            icon={label.theme === 'success' ? Check : undefined}
        />
    ) : null;
}
