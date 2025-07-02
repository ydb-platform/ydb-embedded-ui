import uniqBy from 'lodash/uniqBy';

import type {MetaClusterVersion} from '../types/api/meta';
import type {VersionToColorMap} from '../types/versions';

import {
    COLORS,
    DEFAULT_COLOR,
    getMinorVersion,
    getMinorVersionColorVariant,
    hashCode,
} from './versions';

const UNDEFINED_COLOR_INDEX = '__no_color__';

type VersionsMap = Map<number | string, Set<string>>;

export const getVersionMap = (
    versions: MetaClusterVersion[],
    initialMap: VersionsMap = new Map(),
) => {
    versions.forEach(
        ({version, version_base_color_index: versionBaseColorIndex = UNDEFINED_COLOR_INDEX}) => {
            const minorVersion = getMinorVersion(version);
            if (!initialMap.has(versionBaseColorIndex)) {
                initialMap.set(versionBaseColorIndex, new Set());
            }
            initialMap.get(versionBaseColorIndex)?.add(minorVersion);
        },
    );
    return initialMap;
};

export const getVersionColors = (versionMap: VersionsMap) => {
    const versionToColor: VersionToColorMap = new Map();

    for (const [baseColorIndex, item] of versionMap) {
        Array.from(item)
            // descending by version name: newer versions come first,
            // so the newer version gets the brighter color
            .sort((a, b) => hashCode(b) - hashCode(a))
            .forEach((minor, minorIndex) => {
                if (baseColorIndex === UNDEFINED_COLOR_INDEX) {
                    versionToColor.set(minor, DEFAULT_COLOR);
                } else {
                    // baseColorIndex is numeric as we check if it is UNDEFINED_COLOR_INDEX before
                    const currentColorIndex = Number(baseColorIndex) % COLORS.length;
                    const minorQuantity = item.size;

                    const minorColorVariant = getMinorVersionColorVariant(
                        minorIndex,
                        minorQuantity,
                    );
                    const minorColor = COLORS[currentColorIndex][minorColorVariant];

                    versionToColor.set(minor, minorColor);
                }
            });
    }

    return versionToColor;
};

export interface ExtendedMetaClusterVersion extends MetaClusterVersion {
    minorVersion: string;
    color: string | undefined;
}

export const prepareClusterVersions = (
    clusterVersions: MetaClusterVersion[] = [],
    versionToColor: VersionToColorMap,
) => {
    const filteredVersions = clusterVersions.filter((item) => item.version);
    const preparedVersions = uniqBy(filteredVersions, 'version').map((item) => {
        return {
            ...item,
            minorVersion: getMinorVersion(item.version),
        };
    });
    const versionsColors = preparedVersions.reduce<ExtendedMetaClusterVersion[]>((acc, item) => {
        const color = versionToColor.get(item.minorVersion);
        acc.push({...item, color});
        return acc;
    }, []);

    return versionsColors;
};
