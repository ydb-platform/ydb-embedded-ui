import {getMajorVersion, getMinorVersion} from './parseVersion';
import type {VersionsDataMap, VersionsMap} from './types';

export const hashCode = (s: string) => {
    return s.split('').reduce((a, b) => {
        const num = (a << 5) - a + b.charCodeAt(0); // eslint-disable-line
        return num & num; // eslint-disable-line
    }, 0);
};

const getOnPremBuildNumber = (version: string) => {
    const match = version.match(/^\d+\.\d+\.\d+(?:\.ent)?\.(\d+)(?:-[0-9a-zA-Z]+)*$/);
    return match ? Number(match[1]) : undefined;
};

export const compareMinorVersions = (versionA: string, versionB: string) => {
    const buildA = getOnPremBuildNumber(versionA);
    const buildB = getOnPremBuildNumber(versionB);

    if (buildA !== undefined && buildB === undefined) {
        return -1;
    }
    if (buildA === undefined && buildB !== undefined) {
        return 1;
    }
    if (buildA !== undefined && buildB !== undefined && buildA !== buildB) {
        return buildB - buildA;
    }

    return hashCode(versionB) - hashCode(versionA);
};

const getOnPremReleaseParts = (version: string) => {
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
        return undefined;
    }
    return version.split('.').map(Number);
};

const compareMajorVersions = (versionA: string, versionB: string) => {
    const partsA = getOnPremReleaseParts(versionA);
    const partsB = getOnPremReleaseParts(versionB);

    if (partsA && !partsB) {
        return -1;
    }
    if (!partsA && partsB) {
        return 1;
    }
    if (partsA && partsB) {
        for (let index = 0; index < partsA.length; index++) {
            if (partsA[index] !== partsB[index]) {
                return partsB[index] - partsA[index];
            }
        }
    }

    return hashCode(versionA) - hashCode(versionB);
};

export const COLORS = [
    [
        'var(--versions-orange-1)',
        'var(--versions-orange-2)',
        'var(--versions-orange-3)',
        'var(--versions-orange-4)',
    ],
    [
        'var(--versions-yellow-1)',
        'var(--versions-yellow-2)',
        'var(--versions-yellow-3)',
        'var(--versions-yellow-4)',
    ],
    [
        'var(--versions-green-1)',
        'var(--versions-green-2)',
        'var(--versions-green-3)',
        'var(--versions-green-4)',
    ],
    [
        'var(--versions-lightblue-1)',
        'var(--versions-lightblue-2)',
        'var(--versions-lightblue-3)',
        'var(--versions-lightblue-4)',
    ],
    [
        'var(--versions-blue-1)',
        'var(--versions-blue-2)',
        'var(--versions-blue-3)',
        'var(--versions-blue-4)',
    ],
    [
        'var(--versions-violet-1)',
        'var(--versions-violet-2)',
        'var(--versions-violet-3)',
        'var(--versions-violet-4)',
    ],
    [
        'var(--versions-pink-1)',
        'var(--versions-pink-2)',
        'var(--versions-pink-3)',
        'var(--versions-pink-4)',
    ],
    [
        'var(--versions-caramel-1)',
        'var(--versions-caramel-2)',
        'var(--versions-caramel-3)',
        'var(--versions-caramel-4)',
    ],
    [
        'var(--versions-moss-1)',
        'var(--versions-moss-2)',
        'var(--versions-moss-3)',
        'var(--versions-moss-4)',
    ],
    [
        'var(--versions-turquoise-1)',
        'var(--versions-turquoise-2)',
        'var(--versions-turquoise-3)',
        'var(--versions-turquoise-4)',
    ],
    [
        'var(--versions-barbie-1)',
        'var(--versions-barbie-2)',
        'var(--versions-barbie-3)',
        'var(--versions-barbie-4)',
    ],
    [
        'var(--versions-night-1)',
        'var(--versions-night-2)',
        'var(--versions-night-3)',
        'var(--versions-night-4)',
    ],
];

export const DEFAULT_COLOR = 'var(--versions-default-color)';

/** Calculates sub color index */
export function getMinorVersionColorVariant(minorIndex: number, minorQuantity: number) {
    // We have 4 sub colors for each color
    // For 4+ minors first 25% will be colored with the first most bright color
    // Every next 25% will be colored with corresponding color
    // Do not use all colors if there are less than 4 minors

    if (minorQuantity === 1) {
        return 0;
    }
    // Use only 2 colors
    if (minorQuantity === 2) {
        return Math.floor((2 * minorIndex) / minorQuantity);
    }
    // Use only 3 colors
    if (minorQuantity === 3) {
        return Math.floor((3 * minorIndex) / minorQuantity);
    }

    // Max minor index is minorQuantity - 1
    // So result values always will be in range from 0 to 3
    return Math.floor((4 * minorIndex) / minorQuantity);
}

export const getVersionsMap = (versions: string[], initialMap: VersionsMap = new Map()) => {
    versions.forEach((version) => {
        const majorVersion = getMajorVersion(version);
        const minorVersion = getMinorVersion(version);
        if (!initialMap.has(majorVersion)) {
            initialMap.set(majorVersion, new Set());
        }
        initialMap.get(majorVersion)?.add(minorVersion);
    });
    return initialMap;
};

export const getVersionsDataMap = (versionsMap: VersionsMap) => {
    const clustersVersions = Array.from(versionsMap.keys());

    const versionsDataMap: VersionsDataMap = new Map();
    // not every version is colored, therefore iteration index can't be used consistently
    // init with the colors length to put increment right after condition for better readability
    let currentColorIndex = COLORS.length - 1;

    clustersVersions
        // Newer on-prem release lines come first; other formats keep hash-based ordering
        .sort(compareMajorVersions)
        .forEach((version) => {
            if (/^(\w+-)?stable/.test(version) || /^\d+\.\d+\.\d+$/.test(version)) {
                currentColorIndex = (currentColorIndex + 1) % COLORS.length;

                versionsDataMap.set(version, {
                    // Use first color for major
                    color: COLORS[currentColorIndex][0],
                    majorIndex: currentColorIndex,
                    minorIndex: 0,
                });

                const minors = Array.from(versionsMap.get(version) || []).filter(
                    (v) => v !== version,
                );

                const minorQuantity = minors.length;

                minors
                    // Newer on-prem builds come first; other formats keep hash-based ordering
                    .sort(compareMinorVersions)
                    .forEach((minor, minorIndex) => {
                        const minorColorVariant = getMinorVersionColorVariant(
                            minorIndex,
                            minorQuantity,
                        );
                        const minorColor = COLORS[currentColorIndex][minorColorVariant];

                        versionsDataMap.set(minor, {
                            color: minorColor,
                            majorIndex: currentColorIndex,
                            minorIndex: minorIndex,
                        });
                    });
            } else {
                versionsDataMap.set(version, {
                    color: DEFAULT_COLOR,
                });
            }
        });
    return versionsDataMap;
};

export const parseVersionsToVersionsDataMap = (versions: string[] = []) => {
    return getVersionsDataMap(getVersionsMap(versions));
};

export function getColorFromVersionsData(
    version: string,
    versionsDataMap: VersionsDataMap | undefined,
) {
    const minorVersion = getMinorVersion(version);
    const versionData = versionsDataMap?.get(minorVersion);

    return versionData?.color;
}
