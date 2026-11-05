import type {TitledDiskStatusLabelData} from '../../../components/DiskStatus/DiskStatus';
import type {TStorageGroupStateInfo} from '../../../types/api/storage';
import {
    DATA_SEVERITY,
    NUMERIC_SEVERITY_TO_LABEL_VIEW,
    SOLID_RED_SEVERITY,
} from '../../../utils/disks/constants';
import type {DisplaySeverity} from '../../../utils/disks/types';

const stateSeverities = new Map<string, DisplaySeverity>([
    ['ok', DATA_SEVERITY.GREEN],
    ['replicating', DATA_SEVERITY.BLUE],
    ['starting', DATA_SEVERITY.YELLOW],
    ['degraded', DATA_SEVERITY.YELLOW],
    ['dead', SOLID_RED_SEVERITY],
]);

interface ParsedGroupState {
    status: string;
    count?: string;
    value?: string;
}

function isValidCount(value: unknown): value is number {
    return (
        typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffffff
    );
}

function parseStructuredState(
    stateInfo?: TStorageGroupStateInfo | null,
): ParsedGroupState | undefined {
    const status = typeof stateInfo?.Status === 'string' ? stateInfo.Status.trim() : undefined;
    if (!status) {
        return undefined;
    }
    if (status === 'ok') {
        return {status};
    }

    const {Disks, FailRealms} = stateInfo?.Count ?? {};
    const count = Disks?.Value ?? FailRealms?.Value;
    const domains = stateInfo?.FailedDomainsPerRealm;

    // Incomplete or invalid structured data must not hide the legacy state details.
    if (
        Boolean(Disks) === Boolean(FailRealms) ||
        !isValidCount(count) ||
        (domains !== undefined && (!Array.isArray(domains) || !domains.every(isValidCount)))
    ) {
        return undefined;
    }

    return {
        status,
        count: String(count),
        value: `${count}${domains?.length ? ` (${domains.join(',')})` : ''}`,
    };
}

function parseLegacyState(state?: string | null): ParsedGroupState | undefined {
    const normalizedState = state?.trim();

    if (!normalizedState || normalizedState.startsWith(':')) {
        return undefined;
    }

    const match = normalizedState.match(/^([^:]+)(?::\s*(.+))?$/);
    const status = (match?.[1] ?? normalizedState).trim();
    const value = match?.[2]?.trim();

    return {
        status,
        count: value?.split('(', 1)[0].trim(),
        value: value?.replace(/\s*\(/g, ' ('),
    };
}

export function getStorageGroupStateLabel(
    state?: string | null,
    stateInfo?: TStorageGroupStateInfo | null,
): TitledDiskStatusLabelData | undefined {
    const parsedState = parseStructuredState(stateInfo) ?? parseLegacyState(state);
    if (!parsedState) {
        return undefined;
    }

    const {status, count, value} = parsedState;
    let severity = stateSeverities.get(status) ?? DATA_SEVERITY.GREY;

    if (status === 'degraded' && count === '2') {
        severity = DATA_SEVERITY.RED;
    }

    const labelView = NUMERIC_SEVERITY_TO_LABEL_VIEW[severity];
    const title = status[0].toUpperCase() + status.slice(1);

    return {
        title,
        value,
        theme: labelView.theme,
        dangerHeavy: Boolean(labelView.dangerHeavy),
    };
}
