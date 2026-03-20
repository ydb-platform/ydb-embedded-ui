import type {PreparedVersion} from '../../../utils/versions/types';
import {getFirstVersion} from '../columns';

describe('getFirstVersion', () => {
    it('should sort versions with multi-digit components correctly', () => {
        const preparedVersions: PreparedVersion[] = [
            {version: '24.3.1.46', count: 1},
            {version: '24.3.1.9', count: 1},
            {version: '24.3.1.100', count: 1},
        ];

        const result = getFirstVersion(preparedVersions);

        // After stripping major version (24.), should be: 3.1.9, 3.1.46, 3.1.100
        expect(result).toBe('3.1.9');
    });

    it('should handle versions with different component counts', () => {
        const preparedVersions: PreparedVersion[] = [
            {version: '24.3.1', count: 1},
            {version: '24.3.1.5', count: 1},
            {version: '24.3', count: 1},
        ];

        const result = getFirstVersion(preparedVersions);

        // After stripping: 3, 3.1, 3.1.5 -> should return 3
        expect(result).toBe('3');
    });

    it('should handle single version', () => {
        const preparedVersions: PreparedVersion[] = [{version: '24.3.1.46', count: 1}];

        const result = getFirstVersion(preparedVersions);

        expect(result).toBe('3.1.46');
    });

    it('should return undefined for empty array', () => {
        const preparedVersions: PreparedVersion[] = [];

        const result = getFirstVersion(preparedVersions);

        expect(result).toBeUndefined();
    });

    it('should sort patch versions correctly (regression test)', () => {
        const preparedVersions: PreparedVersion[] = [
            {version: '24.3.1.2', count: 1},
            {version: '24.3.1.10', count: 1},
            {version: '24.3.1.1', count: 1},
            {version: '24.3.1.20', count: 1},
        ];

        const result = getFirstVersion(preparedVersions);

        // After stripping: 3.1.1, 3.1.2, 3.1.10, 3.1.20
        expect(result).toBe('3.1.1');
    });

    it('should handle versions with large numbers', () => {
        const preparedVersions: PreparedVersion[] = [
            {version: '24.3.1.999', count: 1},
            {version: '24.3.1.1000', count: 1},
            {version: '24.3.1.99', count: 1},
        ];

        const result = getFirstVersion(preparedVersions);

        // After stripping: 3.1.99, 3.1.999, 3.1.1000
        expect(result).toBe('3.1.99');
    });

    it('should handle minor version differences', () => {
        const preparedVersions: PreparedVersion[] = [
            {version: '24.3.10.1', count: 1},
            {version: '24.3.2.1', count: 1},
            {version: '24.3.9.1', count: 1},
        ];

        const result = getFirstVersion(preparedVersions);

        // After stripping: 3.2.1, 3.9.1, 3.10.1
        expect(result).toBe('3.2.1');
    });

    it('should handle versions with text suffixes (hotfix builds)', () => {
        const preparedVersions: PreparedVersion[] = [
            {version: '25.3.1.25-hotfixblobstorage-1', count: 1},
            {version: '25.3.1.9', count: 1},
            {version: '25.3.1.46', count: 1},
        ];

        const result = getFirstVersion(preparedVersions);

        // After stripping: 3.1.9, 3.1.25-hotfixblobstorage-1, 3.1.46
        // Numeric parts: 3.1.9 < 3.1.25 < 3.1.46
        expect(result).toBe('3.1.9');
    });

    it('should handle ydb-stable prefix versions', () => {
        const preparedVersions: PreparedVersion[] = [
            {version: 'ydb-stable-25-3-1-25-hotfixblobstorage-1', count: 1},
            {version: 'ydb-stable-25-3-1-9', count: 1},
            {version: 'ydb-stable-25-3-1-100', count: 1},
        ];

        const result = getFirstVersion(preparedVersions);

        // These versions don't start with a digit, so no stripping occurs
        // Should compare: ydb (same), stable (same), 25 (same), 3 (same), 1 (same), then 9 < 25 < 100
        expect(result).toBe('ydb-stable-25-3-1-9');
    });

    it('should handle mixed numeric and text components', () => {
        const preparedVersions: PreparedVersion[] = [
            {version: '24.3.1.alpha', count: 1},
            {version: '24.3.1.beta', count: 1},
            {version: '24.3.1.10', count: 1},
        ];

        const result = getFirstVersion(preparedVersions);

        // After stripping: 3.1.10, 3.1.alpha, 3.1.beta
        // Numeric 10 should come before text (alpha, beta)
        expect(result).toBe('3.1.10');
    });
});
