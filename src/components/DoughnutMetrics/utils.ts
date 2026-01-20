// Constants
export const SIZE_CONFIG = {
    small: {width: 65, strokeWidth: 8, textVariant: 'subheader-1'},
    medium: {width: 100, strokeWidth: 16, textVariant: 'subheader-2'},
    large: {width: 130, strokeWidth: 20, textVariant: 'subheader-3'},
} as const;

export const ROTATION_OFFSET = 0.75; // Start from bottom (270 degrees)

/**
 * Calculate the circumference of a circle given its radius
 */
export function calculateCircumference(radius: number): number {
    return 2 * Math.PI * radius;
}

/**
 * Calculate stroke-dasharray for SVG circle progress fill
 * @param fillWidth - Progress percentage (0-100+)
 * @param circumference - Circle circumference
 * @returns Stroke-dasharray string for filled portion
 */
export function calculateStrokeDasharray(fillWidth: number, circumference: number): string {
    if (fillWidth <= 0) {
        return '0 0';
    }

    const filledLength = (Math.min(fillWidth, 100) / 100) * circumference;
    return `${filledLength} ${circumference - filledLength}`;
}

/**
 * Calculate stroke-dasharray for overlap portion when progress exceeds 100%
 * @param fillWidth - Progress percentage (0-100+)
 * @param circumference - Circle circumference
 * @returns Stroke-dasharray string for overlap portion
 */
export function calculateOverlapDasharray(fillWidth: number, circumference: number): string {
    if (fillWidth <= 100) {
        return '0 0';
    }

    const overlapLength = ((fillWidth - 100) / 100) * circumference;
    return `${overlapLength} ${circumference - overlapLength}`;
}
