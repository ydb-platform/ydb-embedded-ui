import type {TitledDiskStatusLabelData} from '../../../components/DiskStatus/DiskStatus';
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

export function getStorageGroupStateLabel(
    state?: string | null,
): TitledDiskStatusLabelData | undefined {
    const normalizedState = state?.trim();

    if (!normalizedState) {
        return undefined;
    }

    const match = normalizedState.match(/^([^:]+)(?::\s*(.+))?$/);
    const status = (match?.[1] ?? normalizedState).trim();
    const value = match?.[2]?.trim();
    let severity = stateSeverities.get(status) ?? DATA_SEVERITY.GREY;

    if (status === 'degraded') {
        const count = value?.split('(', 1)[0].trim();

        if (count === '2') {
            severity = DATA_SEVERITY.RED;
        }
    }

    const labelView = NUMERIC_SEVERITY_TO_LABEL_VIEW[severity];
    const title = status[0].toUpperCase() + status.slice(1);
    const formattedValue = value?.replace(/\s*\(/g, ' (');

    return {
        title,
        value: formattedValue,
        theme: labelView.theme,
        dangerHeavy: Boolean(labelView.dangerHeavy),
    };
}
