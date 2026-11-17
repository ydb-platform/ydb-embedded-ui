import i18n from '../../i18n';

/**
 * @param value relative path typed by the user
 * @param existingPaths relative paths of directories that already exist, with a trailing slash
 */
export function validateRelativePath(value: string, existingPaths: string[] = []) {
    if (!value) {
        return i18n('alert_empty-path');
    }
    if (/\s/.test(value)) {
        return i18n('alert_whitespace-not-allowed');
    }
    if (value.endsWith('/')) {
        return i18n('alert_directory-name-required');
    }
    if (existingPaths.includes(`${value}/`)) {
        return i18n('alert_directory-exists');
    }
    return '';
}
