import type {
    ExportToS3Metadata,
    ExportToYtMetadata,
    ImportFromS3Metadata,
    IndexBuildMetadata,
    TOperation,
} from '../../types/api/operations';

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
    translateProgress: (key: string) => string,
): string | null {
    const metadata = operation.metadata;

    if (!metadata) {
        return null;
    }

    // BuildIndex: numeric progress (0-100)
    if ('progress' in metadata && typeof metadata.progress === 'number') {
        const buildIndexMetadata = metadata as IndexBuildMetadata;
        if (buildIndexMetadata.progress !== undefined) {
            return `${Math.round(buildIndexMetadata.progress)}%`;
        }
    }

    // Import/Export: calculate from items_progress or show enum value
    const importExportMetadata = metadata as
        | ImportFromS3Metadata
        | ExportToS3Metadata
        | ExportToYtMetadata
        | undefined;

    if (importExportMetadata) {
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

            // Convert PROGRESS_DONE -> progress_done for i18n key
            const i18nKey = progressValue.toLowerCase();

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
