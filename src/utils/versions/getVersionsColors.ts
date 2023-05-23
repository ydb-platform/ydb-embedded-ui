import type {VersionToColorMap, VersionsMap} from '../../types/versions';

import {getMajorVersion, getMinorVersion} from './parseVersion';

export const hashCode = (s: string) => {
    return s.split('').reduce((a, b) => {
        const num = (a << 5) - a + b.charCodeAt(0); // eslint-disable-line
        return num & num; // eslint-disable-line
    }, 0);
};

// 11 distinct colors from https://mokole.com/palette.html
export const COLORS = [
    '#008000', // green
    '#4169e1', // royalblue
    '#ffd700', // gold
    '#ff8c00', // darkorange
    '#808000', // olive
    '#e9967a', // darksalmon
    '#ff1493', // deeppink
    '#00bfff', // deepskyblue
    '#da70d6', // orchid
    '#3cb371', // mediumseagreen
    '#b22222', // firebrick
];

export const GRAY_COLOR = '#bfbfbf'; // --yc-color-base-neutral-hover

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

    const versionToColor: VersionToColorMap = new Map();
    // not every version is colored, therefore iteration index can't be used consistently
    // init with the colors length to put increment right after condition for better readability
    let currentColorIndex = COLORS.length - 1;

    clustersVersions
        // ascending by version name, just for consistency
        // sorting only impacts color choose for a version
        .sort((a, b) => a.hash - b.hash)
        .forEach((item) => {
            if (/^(\w+-)?stable/.test(item.version)) {
                currentColorIndex = (currentColorIndex + 1) % COLORS.length;

                versionToColor.set(item.version, COLORS[currentColorIndex]);

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
                        const majorColor = COLORS[currentColorIndex];
                        const opacityPercent = Math.max(
                            100 - minorIndex * (100 / minorQuantity),
                            20,
                        );
                        const hexOpacity = Math.round((opacityPercent * 255) / 100).toString(16);
                        const versionColor = `${majorColor}${hexOpacity}`;
                        versionToColor.set(minor.version, versionColor);
                    });
            } else {
                versionToColor.set(item.version, GRAY_COLOR);
            }
        });
    return versionToColor;
};

export const parseVersionsToVersionToColorMap = (versions: string[] = []) => {
    return getVersionToColorMap(getVersionsMap(versions));
};
