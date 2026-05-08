export const ROT_MEDIA_TYPE = 'ROT';
export const HDD_MEDIA_TYPE = 'HDD';
export const SSD_MEDIA_TYPE = 'SSD';
export const UNKNOWN_MEDIA_TYPE = 'Unknown';

const MEDIA_TYPE_SEPARATOR = ',';

export function normalizeMediaType(mediaType?: string) {
    if (!mediaType) {
        return UNKNOWN_MEDIA_TYPE;
    }

    const [rawMediaType] = mediaType.split(MEDIA_TYPE_SEPARATOR);
    const normalizedMediaType = rawMediaType?.trim().toUpperCase();

    if (!normalizedMediaType) {
        return UNKNOWN_MEDIA_TYPE;
    }

    if (normalizedMediaType === ROT_MEDIA_TYPE) {
        return HDD_MEDIA_TYPE;
    }

    if (normalizedMediaType === UNKNOWN_MEDIA_TYPE.toUpperCase()) {
        return UNKNOWN_MEDIA_TYPE;
    }

    return normalizedMediaType;
}
