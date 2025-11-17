import type {
    ExportToS3Metadata,
    ExportToYtMetadata,
    ImportFromS3Metadata,
    IndexBuildMetadata,
    TOperation,
} from '../../types/api/operations';

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
 *
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
 *
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

    // BuildIndex: numeric progress (0-100), discriminated by @type
    if (metadata['@type'] === 'type.googleapis.com/Ydb.Table.IndexBuildMetadata') {
        const buildIndexMetadata = metadata as IndexBuildMetadata;
        if (typeof buildIndexMetadata.progress === 'number') {
            return `${Math.round(buildIndexMetadata.progress)}%`;
        }
    }

    // Import/Export: calculate from items_progress or show enum value
    if (
        metadata['@type'] === 'type.googleapis.com/Ydb.Import.ImportFromS3Metadata' ||
        metadata['@type'] === 'type.googleapis.com/Ydb.Export.ExportToS3Metadata' ||
        metadata['@type'] === 'type.googleapis.com/Ydb.Export.ExportToYtMetadata'
    ) {
        const importExportMetadata = metadata as
            | ImportFromS3Metadata
            | ExportToS3Metadata
            | ExportToYtMetadata;

        // Try to calculate percentage from items_progress
        const calculatedProgress = calculateImportExportProgress(importExportMetadata);
        if (calculatedProgress !== null) {
            return `${calculatedProgress}%`;
        }

        // Fallback to enum progress value
        if (importExportMetadata.progress) {
            const progressValue =
                typeof importExportMetadata.progress === 'string'
                    ? importExportMetadata.progress
                    : String(importExportMetadata.progress);

            // Backend enums are PROGRESS_DONE, PROGRESS_PREPARING, etc.
            // Map them to i18n keys value_progress_done, value_progress_preparing, etc.
            const normalized = progressValue.toLowerCase(); // progress_done
            const i18nKey = `value_${normalized}` as OperationProgressKey;

            // Try to get translated value, fallback to original value
            try {
                const translated = translateProgress(i18nKey);
                if (translated && translated !== i18nKey) {
                    return translated;
                }
            } catch {
                // Translation function failed, use original value
            }

            return progressValue;
        }
    }

    return null;
}
