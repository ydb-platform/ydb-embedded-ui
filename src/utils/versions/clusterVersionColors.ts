import type {MetaClusterVersion} from '../../types/api/meta';

import {sortVersions} from './sortVersions';
import type {
    ColorIndexToVersionsMap,
    PreparedVersion,
    PreparedVersions,
    VersionsDataMap,
} from './types';

import {COLORS, DEFAULT_COLOR, getMinorVersion, getMinorVersionColorVariant, hashCode} from '.';

const UNDEFINED_COLOR_INDEX = '__no_color__';

export const getVersionMap = (
    versions: MetaClusterVersion[],
    initialMap: ColorIndexToVersionsMap = new Map(),
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

export const getVersionsData = (versionMap: ColorIndexToVersionsMap) => {
    const versionsDataMap: VersionsDataMap = new Map();

    for (const [baseColorIndex, item] of versionMap) {
        Array.from(item)
            // descending by version name: newer versions come first,
            // so the newer version gets the brighter color
            .sort((a, b) => hashCode(b) - hashCode(a))
            .forEach((minor, minorIndex) => {
                if (baseColorIndex === UNDEFINED_COLOR_INDEX) {
                    versionsDataMap.set(minor, {
                        color: DEFAULT_COLOR,
                    });
                } else {
                    // baseColorIndex is numeric as we check if it is UNDEFINED_COLOR_INDEX before
                    const currentColorIndex = Number(baseColorIndex) % COLORS.length;
                    const minorQuantity = item.size;

                    const minorColorVariant = getMinorVersionColorVariant(
                        minorIndex,
                        minorQuantity,
                    );
                    const minorColor = COLORS[currentColorIndex][minorColorVariant];

                    versionsDataMap.set(minor, {
                        color: minorColor,
                        majorIndex: currentColorIndex,
                        minorIndex,
                    });
                }
            });
    }

    return versionsDataMap;
};

export const prepareClusterVersions = (
    clusterVersions: MetaClusterVersion[] = [],
    versionsDataMap: VersionsDataMap,
): PreparedVersion[] => {
    const filteredVersions = clusterVersions.filter((item) => item.version);

    const result: PreparedVersions = {};

    filteredVersions.forEach((item) => {
        if (result[item.version]) {
            // Sum count for versions of different nodes types
            const currentCount = result[item.version].count || 0;
            const itemCount = item.count || 0;

            result[item.version].count = currentCount + itemCount;
        }

        const minorVersion = getMinorVersion(item.version);
        const data = versionsDataMap.get(minorVersion);

        result[item.version] = {
            version: item.version,
            minorVersion,
            color: data?.color,
            majorIndex: data?.majorIndex,
            minorIndex: data?.minorIndex,
            count: item.count || 0,
        };
    });

    return sortVersions(Object.values(result));
};
