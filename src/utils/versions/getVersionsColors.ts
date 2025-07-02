import {getTheme} from '..';
import type {VersionToColorMap, VersionsMap} from '../../types/versions';

import {getMajorVersion, getMinorVersion} from './parseVersion';

export const hashCode = (s: string) => {
    return s.split('').reduce((a, b) => {
        const num = (a << 5) - a + b.charCodeAt(0); // eslint-disable-line
        return num & num; // eslint-disable-line
    }, 0);
};

const DARK_COLORS = [
    ['#D50C38', '#FF2051', '#FB3A64', '#FF6989'],
    ['#EB3320', '#FF503E', '#FF8376', '#FFA399'],
    ['#F47B10', '#FF9B43', '#FFB06A', '#FFC693'],
    ['#FFEA00', '#FFEE31', '#FFF480', '#FFF8A9'],
    ['#83D400', '#B1FF33', '#CBFF78', '#DDFFA7'],
    ['#27C98B', '#16FFA6', '#4CFFBA', '#9BFFD8'],
    ['#0EDBDE', '#0CFBFF', '#63FDFF', '#B1FEFF'],
    ['#2059FF', '#4070FF', '#658BFF', '#A1B9FF'],
    ['#AB07E3', '#C92CFF', '#DD78FF', '#E79FFF'],
    ['#E71498', '#FF34B3', '#FF75CB', '#FFB0E1'],
];

const LIGHT_COLORS = [
    ['#F4315B', '#FF426B', '#FF7391', '#FF8BA4'],
    ['#FF6050', '#FF7A6D', '#FFAFA6', '#FFBCB5'],
    ['#FF9233', '#FFAD65', '#FFC593', '#FFD3AC'],
    ['#FFEA00', '#FFEE31', '#FFF480', '#FFF8A9'],
    ['#A1EE26', '#B1FF33', '#CBFF78', '#DDFFA7'],
    ['#31EBA4', '#16FFA6', '#4CFFBA', '#9BFFD8'],
    ['#2EE4E8', '#0CFBFF', '#63FDFF', '#B1FEFF'],
    ['#386BFF', '#4070FF', '#658BFF', '#A1B9FF'],
    ['#C73AF7', '#C92CFF', '#DD78FF', '#E79FFF'],
    ['#FF49BB', '#FF34B3', '#FF75CB', '#FFB0E1'],
];

export function getColors() {
    return getTheme() === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

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

// TODO: replace with color suggested by designer
export const DEFAULT_COLOR = 'saddlebrown';

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

export const getVersionToColorMap = (versionsMap: VersionsMap) => {
    const clustersVersions = Array.from(versionsMap.keys()).map((version) => {
        return {
            version,
            hash: hashCode(version),
        };
    });

    const colors = getColors();

    const versionToColor: VersionToColorMap = new Map();
    // not every version is colored, therefore iteration index can't be used consistently
    // init with the colors length to put increment right after condition for better readability
    let currentColorIndex = colors.length - 1;

    clustersVersions
        // ascending by version name, just for consistency
        // sorting only impacts color choose for a version
        .sort((a, b) => a.hash - b.hash)
        .forEach((item) => {
            if (/^(\w+-)?stable/.test(item.version)) {
                currentColorIndex = (currentColorIndex + 1) % colors.length;

                // Use fisrt color for major
                versionToColor.set(item.version, colors[currentColorIndex][0]);

                const minors = Array.from(versionsMap.get(item.version) || [])
                    .filter((v) => v !== item.version)
                    .map((v) => {
                        return {
                            version: v,
                            hash: hashCode(v),
                        };
                    });

                const minorQuantity = minors.length;

                minors
                    // descending by version name: newer versions come first,
                    // so the newer version gets the brighter color
                    .sort((a, b) => b.hash - a.hash)
                    .forEach((minor, minorIndex) => {
                        const minorColorVariant = getMinorVersionColorVariant(
                            minorIndex,
                            minorQuantity,
                        );
                        const minorColor = colors[currentColorIndex][minorColorVariant];
                        versionToColor.set(minor.version, minorColor);
                    });
            } else {
                versionToColor.set(item.version, DEFAULT_COLOR);
            }
        });
    return versionToColor;
};

export const parseVersionsToVersionToColorMap = (versions: string[] = []) => {
    return getVersionToColorMap(getVersionsMap(versions));
};
