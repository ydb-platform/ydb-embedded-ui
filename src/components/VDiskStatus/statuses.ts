import {
    ArrowsRotateLeft,
    ArrowsRotateLeftSlash,
    Check,
    CirclePause,
    CircleStop,
} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import {EVDiskDetailedReplicationStatus, EVDiskState} from '../../types/api/vdisk';
import {
    NOT_AVAILABLE_SEVERITY,
    NUMERIC_SEVERITY_TO_LABEL_VIEW,
    SOLID_RED_SEVERITY,
    VDISK_STATE_SEVERITY_FOR_STATE_MODE,
} from '../../utils/disks/constants';
import {calculateStateIcon} from '../../utils/disks/iconCalculators';
import type {PreparedVDisk} from '../../utils/disks/types';

import {vDiskStatusKeyset as i18n} from './i18n';

export interface VDiskStatusLabel {
    value: string;
    title?: string;
    theme?: LabelProps['theme'];
    icon?: IconData;
    tooltip?: string;
    dangerHeavy?: boolean;
}

export function isVDiskFlagVisible(flag?: EFlag): flag is EFlag {
    return Boolean(flag && flag !== EFlag.Grey);
}

export function getVDiskTypeTooltip(type?: string): string | undefined {
    switch (type?.toUpperCase()) {
        case 'HDD':
            return i18n('context_hdd');
        case 'SSD':
            return i18n('context_ssd');
        case 'NVME':
            return i18n('context_nvme');
        default:
            return undefined;
    }
}

export function getVDiskStateLabel(data: PreparedVDisk): VDiskStatusLabel {
    const state = data.VDiskState;
    const severity = state
        ? (VDISK_STATE_SEVERITY_FOR_STATE_MODE[state] ?? NOT_AVAILABLE_SEVERITY)
        : NOT_AVAILABLE_SEVERITY;
    if (
        !state ||
        !Object.values(EVDiskState).includes(state) ||
        severity === NOT_AVAILABLE_SEVERITY
    ) {
        return {
            value: i18n('value_no-data'),
            theme: 'unknown',
            tooltip: i18n('context_state-no-data'),
        };
    }

    const labels: Record<EVDiskState, Pick<VDiskStatusLabel, 'value' | 'tooltip'>> = {
        [EVDiskState.OK]: {
            value: i18n('value_ok'),
            tooltip: i18n('context_state-ok'),
        },
        [EVDiskState.Initial]: {
            value: i18n('value_initial'),
            tooltip: i18n('context_state-initial'),
        },
        [EVDiskState.SyncGuidRecovery]: {
            value: i18n('value_sync-guid-recovery'),
            tooltip: i18n('context_state-sync-guid-recovery'),
        },
        [EVDiskState.PDiskError]: {
            value: i18n('value_pdisk-error'),
            tooltip: i18n('context_state-pdisk-error'),
        },
        [EVDiskState.LocalRecoveryError]: {
            value: i18n('value_local-recovery-error'),
            tooltip: i18n('context_state-local-recovery-error'),
        },
        [EVDiskState.SyncGuidRecoveryError]: {
            value: i18n('value_sync-guid-recovery-error'),
            tooltip: i18n('context_state-sync-guid-recovery-error'),
        },
    };

    return {
        ...labels[state],
        ...NUMERIC_SEVERITY_TO_LABEL_VIEW[severity],
        icon: state === EVDiskState.OK ? Check : calculateStateIcon(data),
        dangerHeavy: severity === SOLID_RED_SEVERITY,
    };
}

export function getVDiskReplicationLabel(data: PreparedVDisk): VDiskStatusLabel | undefined {
    switch (data.DetailedReplicationStatus) {
        case EVDiskDetailedReplicationStatus.Replicated:
            return replicatedLabel();
        case EVDiskDetailedReplicationStatus.InProgress:
            return {
                title: i18n('label_replication'),
                value: i18n('value_in-progress'),
                theme: 'info',
                icon: ArrowsRotateLeft,
                tooltip: i18n('context_replication-in-progress'),
            };
        case EVDiskDetailedReplicationStatus.WaitingForToken:
            return {
                title: i18n('label_replication'),
                value: i18n('value_waiting-for-token'),
                theme: 'info',
                icon: CirclePause,
                tooltip: i18n('context_replication-waiting-for-token'),
            };
        case EVDiskDetailedReplicationStatus.PhantomsOnly:
            return {
                title: i18n('label_replication'),
                value: i18n('value_phantoms-only'),
                theme: 'info',
                icon: CircleStop,
                tooltip: i18n('context_replication-phantoms-only'),
            };
        default:
            if (data.Replicated === true) {
                return replicatedLabel();
            }
            if (data.Replicated === false) {
                return {
                    value: i18n('label_not-replicated'),
                    theme: 'normal',
                    icon: ArrowsRotateLeftSlash,
                    tooltip: i18n('context_not-replicated'),
                };
            }
            return undefined;
    }
}

function replicatedLabel(): VDiskStatusLabel {
    return {
        value: i18n('label_replicated'),
        theme: 'success',
        icon: Check,
        tooltip: i18n('context_replicated'),
    };
}
