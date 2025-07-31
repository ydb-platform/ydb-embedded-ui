import {hashCode} from './getVersionsColors';
import type {PreparedVersion} from './types';

/**
 * Sorts cluster versions according to the following rules:
 * 1. First by majorIndex in ascending order (lower index first)
 * - In embedded versions higher version numbers typically have lower indices (e.g., v3.0.0: index 0, v2.0.0: index 1, v1.0.0: index 2)
 * - In multi-cluster version indices may be provided by backend with no specific rule, but we use the same sorting for consistency
 * - Versions with undefined majorIndex come last
 * 2. Then by minorIndex in ascending order (lower index first) when majorIndex is the same
 * - Higher minor versions typically have lower indices
 * - Versions with undefined minorIndex come last within their major group
 * 3. Finally by version string hashCode in descending order when both indices are the same
 * - Higher hash values come first
 *
 * The function creates a copy of the input array to avoid modifying the original.
 * @param versions - Array of prepared cluster versions to sort
 * @returns A new sorted array of cluster versions
 */
export function sortVersions(versions: PreparedVersion[]) {
    return versions.slice().sort((versionA, versionB) => {
        if (versionA.majorIndex !== versionB.majorIndex) {
            if (versionA.majorIndex === undefined) {
                return 1;
            }
            if (versionB.majorIndex === undefined) {
                return -1;
            }
            return versionA.majorIndex - versionB.majorIndex;
        }
        if (versionA.minorIndex !== versionB.minorIndex) {
            if (versionA.minorIndex === undefined) {
                return 1;
            }
            if (versionB.minorIndex === undefined) {
                return -1;
            }
            return versionA.minorIndex - versionB.minorIndex;
        }

        return hashCode(versionB.version) - hashCode(versionA.version);
    });
}
