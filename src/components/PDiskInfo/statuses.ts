import {Ban, Check, CircleQuestionFill, CircleXmarkFill} from '@gravity-ui/icons';

import type {EDecommitStatus, EDriveStatus, EMaintenanceStatus} from '../../types/api/pdisk';
import {TPDiskState} from '../../types/api/pdisk';
import {
    NOT_AVAILABLE_SEVERITY,
    NUMERIC_SEVERITY_TO_LABEL_VIEW,
    SOLID_RED_SEVERITY,
} from '../../utils/disks/constants';
import {
    getPDiskDecommitDisplayState,
    getPDiskDriveDisplayState,
    getPDiskMaintenanceDisplayState,
    getPDiskStateDisplayState,
} from '../../utils/disks/pdiskState';
import type {DiskStatusLabelData} from '../DiskStatus/DiskStatus';

import {pDiskInfoKeyset as i18n} from './i18n';

type StatusText = Pick<DiskStatusLabelData, 'value' | 'tooltip'>;

function unknownLabel(): DiskStatusLabelData {
    return {
        value: i18n('value_unknown'),
        tooltip: i18n('context_unknown'),
        theme: 'unknown',
        icon: CircleQuestionFill,
    };
}

function getLabelView({
    severity,
    icon,
}: ReturnType<typeof getPDiskStateDisplayState>): Pick<
    DiskStatusLabelData,
    'theme' | 'icon' | 'dangerHeavy'
> {
    return {
        theme:
            severity === NOT_AVAILABLE_SEVERITY
                ? 'unknown'
                : NUMERIC_SEVERITY_TO_LABEL_VIEW[severity]?.theme,
        icon,
        dangerHeavy: severity === SOLID_RED_SEVERITY,
    };
}

export function getPDiskStateLabel(state?: TPDiskState): DiskStatusLabelData {
    const labels: Partial<Record<TPDiskState, StatusText>> = {
        [TPDiskState.Normal]: {value: i18n('value_ok'), tooltip: i18n('context_state-normal')},
        [TPDiskState.Initial]: {
            value: i18n('value_initial'),
            tooltip: i18n('context_state-initial'),
        },
        [TPDiskState.InitialFormatRead]: {
            value: i18n('value_initial-format-read'),
            tooltip: i18n('context_initial-format-read'),
        },
        [TPDiskState.InitialSysLogRead]: {
            value: i18n('value_initial-sys-log-read'),
            tooltip: i18n('context_initial-sys-log-read'),
        },
        [TPDiskState.InitialCommonLogRead]: {
            value: i18n('value_initial-common-log-read'),
            tooltip: i18n('context_initial-common-log-read'),
        },
        [TPDiskState.OpenFileError]: {
            value: i18n('value_open-file-error'),
            tooltip: i18n('context_open-file-error'),
        },
        [TPDiskState.DeviceIoError]: {
            value: i18n('value_device-io-error'),
            tooltip: i18n('context_device-io-error'),
        },
        [TPDiskState.Stopped]: {value: i18n('value_stopped'), tooltip: i18n('context_stopped')},
        [TPDiskState.InitialFormatReadError]: {
            value: i18n('value_initial-format-read-error'),
            tooltip: i18n('context_initial-format-read-error'),
        },
        [TPDiskState.InitialSysLogReadError]: {
            value: i18n('value_initial-sys-log-read-error'),
            tooltip: i18n('context_initial-sys-log-read-error'),
        },
        [TPDiskState.InitialSysLogParseError]: {
            value: i18n('value_initial-sys-log-parse-error'),
            tooltip: i18n('context_initial-sys-log-parse-error'),
        },
        [TPDiskState.CommonLoggerInitError]: {
            value: i18n('value_common-logger-init-error'),
            tooltip: i18n('context_common-logger-init-error'),
        },
        [TPDiskState.InitialCommonLogReadError]: {
            value: i18n('value_initial-common-log-read-error'),
            tooltip: i18n('context_initial-common-log-read-error'),
        },
        [TPDiskState.InitialCommonLogParseError]: {
            value: i18n('value_initial-common-log-parse-error'),
            tooltip: i18n('context_initial-common-log-parse-error'),
        },
        [TPDiskState.ChunkQuotaError]: {
            value: i18n('value_chunk-quota-error'),
            tooltip: i18n('context_chunk-quota-error'),
        },
    };
    const label = state && Object.hasOwn(labels, state) ? labels[state] : undefined;
    if (!label) {
        return unknownLabel();
    }
    const view = getLabelView(getPDiskStateDisplayState(state));
    return {
        ...label,
        ...view,
        icon: state === TPDiskState.Normal ? Check : view.icon,
    };
}

export function getPDiskDriveLabel(status?: EDriveStatus): DiskStatusLabelData | undefined {
    if (!status || status === 'UNKNOWN') {
        return undefined;
    }
    const labels: Record<Exclude<EDriveStatus, 'UNKNOWN'>, StatusText> = {
        ACTIVE: {value: i18n('value_active'), tooltip: i18n('context_active')},
        INACTIVE: {value: i18n('value_inactive'), tooltip: i18n('context_inactive')},
        TO_BE_REMOVED: {value: i18n('value_to-be-removed'), tooltip: i18n('context_to-be-removed')},
        FAULTY: {value: i18n('value_faulty'), tooltip: i18n('context_faulty')},
        BROKEN: {value: i18n('value_broken'), tooltip: i18n('context_broken')},
    };
    if (!Object.hasOwn(labels, status)) {
        return undefined;
    }
    const view = getLabelView(getPDiskDriveDisplayState(status));
    let icon = view.icon;
    if (status === 'ACTIVE') {
        icon = Check;
    } else if (status === 'BROKEN') {
        icon = CircleXmarkFill;
    }
    return {
        ...labels[status],
        ...view,
        icon,
        dangerHeavy: status === 'BROKEN',
    };
}

export function getPDiskDecommitLabel(status?: EDecommitStatus): DiskStatusLabelData | undefined {
    if (!status || status === 'DECOMMIT_UNSET') {
        return undefined;
    }
    const labels: Record<Exclude<EDecommitStatus, 'DECOMMIT_UNSET'>, StatusText> = {
        DECOMMIT_NONE: {value: i18n('value_decommit-none'), tooltip: i18n('context_decommit-none')},
        DECOMMIT_PENDING: {
            value: i18n('value_decommit-pending'),
            tooltip: i18n('context_decommit-pending'),
        },
        DECOMMIT_REJECTED: {
            value: i18n('value_decommit-rejected'),
            tooltip: i18n('context_decommit-rejected'),
        },
        DECOMMIT_IMMINENT: {
            value: i18n('value_decommit-imminent'),
            tooltip: i18n('context_decommit-imminent'),
        },
    };
    if (!Object.hasOwn(labels, status)) {
        return undefined;
    }
    const view = getLabelView(getPDiskDecommitDisplayState(status));
    return {...labels[status], ...view, icon: status === 'DECOMMIT_NONE' ? Ban : view.icon};
}

export function getPDiskMaintenanceLabel(
    status?: EMaintenanceStatus,
): DiskStatusLabelData | undefined {
    if (!status) {
        return undefined;
    }
    const labels: Record<EMaintenanceStatus, StatusText> = {
        NO_REQUEST: {
            value: i18n('value_maintenance-none'),
            tooltip: i18n('context_maintenance-none'),
        },
        NOT_SET: {
            value: i18n('value_maintenance-unset'),
            tooltip: i18n('context_maintenance-unset'),
        },
        NO_NEW_VDISKS: {
            value: i18n('value_maintenance-no-new-vdisks'),
            tooltip: i18n('context_maintenance-no-new-vdisks'),
        },
        LONG_TERM_MAINTENANCE_PLANNED: {
            value: i18n('value_maintenance-long-term'),
            tooltip: i18n('context_maintenance-long-term'),
        },
    };
    if (!Object.hasOwn(labels, status)) {
        return undefined;
    }
    const view = getLabelView(getPDiskMaintenanceDisplayState(status));
    return {
        ...labels[status],
        ...view,
        title: i18n('label_maintenance'),
        // An explicitly unset status is shown as a normal state in the popup design.
        theme: status === 'NOT_SET' ? 'success' : view.theme,
        icon: status === 'NOT_SET' ? undefined : view.icon,
    };
}
