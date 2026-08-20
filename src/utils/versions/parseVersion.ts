const ON_PREM_BUILD_SUFFIX_PATTERN = String.raw`[0-9a-zA-Z]*(?:-[0-9a-zA-Z]+)*`;
const ON_PREM_BUILD_PATTERN = String.raw`\d+${ON_PREM_BUILD_SUFFIX_PATTERN}`;
const ON_PREM_RUNTIME_VERSION_REGEXP = new RegExp(
    String.raw`^(\d+\.\d+\.\d+(?:\.ent)?\.${ON_PREM_BUILD_PATTERN})\.[0-9a-zA-Z]+$`,
);
const ON_PREM_RELEASE_VERSION_REGEXP = new RegExp(
    String.raw`^(\d+\.\d+\.\d+)(?:\.ent)?\.${ON_PREM_BUILD_PATTERN}$`,
);
const ON_PREM_BUILD_REGEXP = new RegExp(
    String.raw`^\d+\.\d+\.\d+(?:\.ent)?\.(\d+)(${ON_PREM_BUILD_SUFFIX_PATTERN})$`,
);

export const getOnPremBuild = (version: string) => {
    const match = version.match(ON_PREM_BUILD_REGEXP);
    return match ? {number: Number(match[1]), suffix: match[2]} : undefined;
};

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
