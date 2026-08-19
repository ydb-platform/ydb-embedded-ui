const ON_PREM_RUNTIME_VERSION_REGEXP = /^(\d+\.\d+\.\d+(?:\.ent)?\.\d+)\.[0-9a-zA-Z]+$/;
const ON_PREM_RELEASE_VERSION_REGEXP = /^(\d+\.\d+\.\d+)(?:\.ent)?\.\d+$/;

export const getMinorVersion = (version: string) => {
    const onPremRuntimeVersionMatch = version.match(ON_PREM_RUNTIME_VERSION_REGEXP);
    if (onPremRuntimeVersionMatch) {
        return onPremRuntimeVersionMatch[1];
    }

    const regexp = /\d{1,}-\d{1,}(-\d){0,}(-hotfix-\d{1,}(-\d{1,})?)?\.[0-9a-zA-Z]+$/;

    let result = version;

    if (regexp.test(version)) {
        result = result.replace(/(-hotfix-\d{1,}(-\d{1,})?)?\.[0-9a-zA-Z]+$/, ''); // stable-19-2-18.bfa368f -> stable-19-2-18
    }

    return result;
};

export const getMajorVersion = (version: string) => {
    const minorVersion = getMinorVersion(version);
    const onPremReleaseVersionMatch = minorVersion.match(ON_PREM_RELEASE_VERSION_REGEXP);
    if (onPremReleaseVersionMatch) {
        return onPremReleaseVersionMatch[1];
    }

    const regexp = /\d{1,}-\d{1,}-\d{1,}/; // to check versions that have minor part

    return regexp.test(minorVersion) ? minorVersion.replace(/-\d{1,}$/, '') : minorVersion;
};
