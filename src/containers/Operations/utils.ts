import type {
    ExportToS3Metadata,
    ExportToYtMetadata,
    ImportFromS3Metadata,
    IndexBuildMetadata,
    TOperation,
} from '../../types/api/operations';
import {OPERATION_METADATA_TYPE_URLS} from '../../types/api/operations';

// Type guards for operation metadata kinds
export function isIndexBuildMetadata(
    metadata: TOperation['metadata'],
): metadata is IndexBuildMetadata {
    if (!metadata) {
        return false;
    }

    return metadata['@type'] === OPERATION_METADATA_TYPE_URLS.IndexBuild;
}

export function isImportFromS3Metadata(
    metadata: TOperation['metadata'],
): metadata is ImportFromS3Metadata {
    if (!metadata) {
        return false;
    }

    return metadata['@type'] === OPERATION_METADATA_TYPE_URLS.ImportFromS3;
}

export function isExportToS3Metadata(
    metadata: TOperation['metadata'],
): metadata is ExportToS3Metadata {
    if (!metadata) {
        return false;
    }

    return metadata['@type'] === OPERATION_METADATA_TYPE_URLS.ExportToS3;
}

export function isExportToYtMetadata(
    metadata: TOperation['metadata'],
): metadata is ExportToYtMetadata {
    if (!metadata) {
        return false;
    }

    return metadata['@type'] === OPERATION_METADATA_TYPE_URLS.ExportToYt;
}

export function isImportExportMetadata(
    metadata: TOperation['metadata'],
): metadata is ImportFromS3Metadata | ExportToS3Metadata | ExportToYtMetadata {
    return (
        isImportFromS3Metadata(metadata) ||
        isExportToS3Metadata(metadata) ||
        isExportToYtMetadata(metadata)
    );
}

// i18n keys for import/export progress enum values
// value_progress_unspecified, value_progress_preparing, etc.
export type OperationProgressKey =
    | 'value_progress_unspecified'
    | 'value_progress_preparing'
    | 'value_progress_transfer_data'
    | 'value_progress_build_indexes'
    | 'value_progress_done'
    | 'value_progress_cancellation'
    | 'value_progress_cancelled'
    | 'value_progress_create_changefeeds';

/**
 * Calculate progress percentage from Import/Export metadata
 *
 * Calculates overall progress based on items_progress array:
 * - Sums all parts_total and parts_completed across all items
 * - Returns percentage rounded to nearest integer
 * @param metadata - Import/Export operation metadata
 * @returns Progress percentage (0-100) or null if cannot be calculated
 */
export function calculateImportExportProgress(
    metadata: ImportFromS3Metadata | ExportToS3Metadata | ExportToYtMetadata | undefined,
): number | null {
    if (!metadata?.items_progress || metadata.items_progress.length === 0) {
        return null;
    }

    let totalParts = 0;
    let completedParts = 0;

    for (const item of metadata.items_progress) {
        if (item.parts_total !== undefined && item.parts_total > 0) {
            totalParts += item.parts_total;
            completedParts += item.parts_completed || 0;
        }
    }

    if (totalParts === 0) {
        return null;
    }

    return Math.round((completedParts / totalParts) * 100);
}

/**
 * Get progress display value for an operation
 *
 * Handles different progress formats:
 * - BuildIndex: numeric progress (0-100) -> "75%"
 * - Import/Export: calculated from items_progress -> "45%" or enum value -> "Done"
 * @param operation - Operation to get progress for
 * @param translateProgress - Function to translate progress enum values (i18n)
 * @returns Formatted progress string or null if no progress available
 */
export function getOperationProgress(
    operation: TOperation,
    translateProgress: (key: OperationProgressKey) => string,
): string | null {
    const metadata = operation.metadata;

    if (!metadata) {
        return null;
    }

    if (isIndexBuildMetadata(metadata)) {
        if (typeof metadata.progress === 'number') {
            return `${Math.round(metadata.progress)}%`;
        }
    }

    // Import/Export: calculate from items_progress or show enum value
    if (isImportExportMetadata(metadata)) {
        // Try to calculate percentage from items_progress
        const calculatedProgress = calculateImportExportProgress(metadata);
        if (calculatedProgress !== null) {
            return `${calculatedProgress}%`;
        }

        // Fallback to enum progress value
        if (metadata.progress) {
            const progressValue =
                typeof metadata.progress === 'string'
                    ? metadata.progress
                    : String(metadata.progress);

            // Backend enums are usually PROGRESS_DONE, PROGRESS_PREPARING, etc.
            // Normalize by stripping optional PROGRESS_ prefix and lowercasing.
            // Both "PROGRESS_DONE" and "DONE" will map to "value_progress_done".
            const base = progressValue.replace(/^PROGRESS_/, '').toLowerCase(); // done
            const i18nKey = `value_progress_${base}` as OperationProgressKey;

            try {
                const translated = translateProgress(i18nKey);
                if (translated && translated !== i18nKey) {
                    return translated;
                }
            } catch {}

            return progressValue;
        }
    }

    return null;
}
