import {ArrowsRotateLeft, Check, CirclePause, CircleQuestion} from '@gravity-ui/icons';
import {Icon, Label, Text} from '@gravity-ui/uikit';
import type {IconData, LabelProps} from '@gravity-ui/uikit';

import {BridgeSyncStatus} from '../../types/api/cluster';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';

import i18n from './i18n';

const statusPresentation: Record<
    BridgeSyncStatus,
    {icon?: IconData; theme?: LabelProps['theme']; label: () => string}
> = {
    [BridgeSyncStatus.SYNCED]: {
        icon: Check,
        theme: 'success',
        label: () => i18n('value_sync-synced'),
    },
    [BridgeSyncStatus.SYNCING]: {
        icon: ArrowsRotateLeft,
        theme: 'info',
        label: () => i18n('value_sync-syncing'),
    },
    [BridgeSyncStatus.PENDING]: {
        icon: CirclePause,
        theme: 'warning',
        label: () => i18n('value_sync-pending'),
    },
    [BridgeSyncStatus.UNKNOWN]: {
        icon: CircleQuestion,
        theme: 'unknown',
        label: () => i18n('value_sync-unknown'),
    },
    [BridgeSyncStatus.NOT_REQUIRED]: {
        label: () => i18n('value_not-required'),
    },
};

export function getBridgeSyncStatusPresentation(status?: BridgeSyncStatus) {
    return status !== undefined && Object.hasOwn(statusPresentation, status)
        ? statusPresentation[status]
        : undefined;
}

export function BridgeSyncStatusLabel({
    status,
    withInfo = false,
    interactive = false,
}: {
    status?: BridgeSyncStatus;
    withInfo?: boolean;
    interactive?: boolean;
}) {
    const presentation = getBridgeSyncStatusPresentation(status);
    if (!presentation) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    if (!presentation.icon) {
        return (
            <Text variant="inherit" color="hint">
                {presentation.label()}
            </Text>
        );
    }

    return (
        <Label
            type={withInfo ? 'info' : 'default'}
            interactive={interactive}
            size="xs"
            theme={presentation.theme}
            icon={<Icon data={presentation.icon} size={12} />}
        >
            {presentation.label()}
        </Label>
    );
}
