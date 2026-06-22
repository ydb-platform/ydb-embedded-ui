export const MAX_ENTITY_PATH_SEGMENT_LENGTH = 255;

const ENTITY_PATH_SEGMENT_REG_EXP = /^[A-Za-z0-9._-]+$/;

export function isValidEntityPathSegment(segment: string) {
    return Boolean(
        segment &&
            segment.length <= MAX_ENTITY_PATH_SEGMENT_LENGTH &&
            ENTITY_PATH_SEGMENT_REG_EXP.test(segment),
    );
}

export function isValidEntityPath(
    value: string,
    {allowLeadingSlash = false}: {allowLeadingSlash?: boolean} = {},
) {
    const normalizedValue = allowLeadingSlash && value.startsWith('/') ? value.slice(1) : value;

    if (!normalizedValue) {
        return false;
    }

    return normalizedValue.split('/').every(isValidEntityPathSegment);
}
