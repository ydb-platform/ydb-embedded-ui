import {sortVersions} from '../sortVersions';
import type {PreparedVersion} from '../types';

describe('sortVersions', () => {
    test('should sort versions by majorIndex in ascending order', function () {
        const versions: PreparedVersion[] = [
            {version: 'v2.0.0', majorIndex: 1},
            {version: 'v1.0.0', majorIndex: 2},
            {version: 'v3.0.0', majorIndex: 0},
        ];

        const sortedVersions = sortVersions(versions);

        expect(sortedVersions).toEqual([
            {version: 'v3.0.0', majorIndex: 0},
            {version: 'v2.0.0', majorIndex: 1},
            {version: 'v1.0.0', majorIndex: 2},
        ]);
    });

    test('should place versions with undefined majorIndex after versions with defined majorIndex', function () {
        const versions: PreparedVersion[] = [
            {version: 'v2.0.0', majorIndex: undefined},
            {version: 'v1.0.0', majorIndex: 2},
            {version: 'v3.0.0', majorIndex: 0},
        ];

        const sortedVersions = sortVersions(versions);

        expect(sortedVersions).toEqual([
            {version: 'v3.0.0', majorIndex: 0},
            {version: 'v1.0.0', majorIndex: 2},
            {version: 'v2.0.0', majorIndex: undefined},
        ]);
    });

    test('should sort versions by minorIndex in ascending order when majorIndex is the same', function () {
        const versions: PreparedVersion[] = [
            {version: 'v1.2.0', majorIndex: 2, minorIndex: 1},
            {version: 'v1.1.0', majorIndex: 2, minorIndex: 2},
            {version: 'v1.3.0', majorIndex: 2, minorIndex: 0},
        ];

        const sortedVersions = sortVersions(versions);

        expect(sortedVersions).toEqual([
            {version: 'v1.3.0', majorIndex: 2, minorIndex: 0},
            {version: 'v1.2.0', majorIndex: 2, minorIndex: 1},
            {version: 'v1.1.0', majorIndex: 2, minorIndex: 2},
        ]);
    });

    test('should place versions with undefined minorIndex after versions with defined minorIndex when majorIndex is the same', function () {
        const versions: PreparedVersion[] = [
            {version: 'v1.2.0', majorIndex: 2, minorIndex: 1},
            {version: 'v1.0.0', majorIndex: 2, minorIndex: undefined},
            {version: 'v1.3.0', majorIndex: 2, minorIndex: 0},
        ];

        const sortedVersions = sortVersions(versions);

        expect(sortedVersions).toEqual([
            {version: 'v1.3.0', majorIndex: 2, minorIndex: 0},
            {version: 'v1.2.0', majorIndex: 2, minorIndex: 1},
            {version: 'v1.0.0', majorIndex: 2, minorIndex: undefined},
        ]);
    });

    test('should sort versions by hashCode when both majorIndex and minorIndex are the same (higher hash first)', function () {
        const versions: PreparedVersion[] = [
            {version: 'v1.1.1', majorIndex: 2, minorIndex: 1},
            {version: 'v1.1.2', majorIndex: 2, minorIndex: 1},
            {version: 'v1.1.0', majorIndex: 2, minorIndex: 1},
        ];

        const sortedVersions = sortVersions(versions);

        expect(sortedVersions).toEqual([
            {version: 'v1.1.2', majorIndex: 2, minorIndex: 1},
            {version: 'v1.1.1', majorIndex: 2, minorIndex: 1},
            {version: 'v1.1.0', majorIndex: 2, minorIndex: 1},
        ]);
    });

    test('should sort versions with undefined major by hashCode', function () {
        const versions: PreparedVersion[] = [
            {version: 'v1.0.0', majorIndex: undefined},
            {version: 'v2.0.0', majorIndex: undefined},
            {version: 'v3.0.0', majorIndex: undefined},
        ];

        const sortedVersions = sortVersions(versions);

        // When majorIndex is undefined, versions are sorted by hashCode
        // This test assumes the hashCode implementation results in this order
        expect(sortedVersions).toEqual([
            {version: 'v3.0.0', majorIndex: undefined},
            {version: 'v2.0.0', majorIndex: undefined},
            {version: 'v1.0.0', majorIndex: undefined},
        ]);
    });

    test('should handle complex sorting with mixed undefined indices', function () {
        const versions: PreparedVersion[] = [
            {version: 'v2.1.0', majorIndex: 1, minorIndex: 1},
            {version: 'v1.0.0', majorIndex: 2, minorIndex: undefined},
            {version: 'v3.0.0', majorIndex: 0, minorIndex: 0},
            {version: 'v1.2.0', majorIndex: 2, minorIndex: 0},
            {version: 'v2.0.0', majorIndex: 1, minorIndex: undefined},
        ];

        const sortedVersions = sortVersions(versions);

        expect(sortedVersions).toEqual([
            {version: 'v3.0.0', majorIndex: 0, minorIndex: 0},
            {version: 'v2.1.0', majorIndex: 1, minorIndex: 1},
            {version: 'v2.0.0', majorIndex: 1, minorIndex: undefined},
            {version: 'v1.2.0', majorIndex: 2, minorIndex: 0},
            {version: 'v1.0.0', majorIndex: 2, minorIndex: undefined},
        ]);
    });

    test('should handle empty array', function () {
        const versions: PreparedVersion[] = [];
        const sortedVersions = sortVersions(versions);
        expect(sortedVersions).toEqual([]);
    });
});
