import {DEFAULT_COLOR, parseVersionsToVersionsDataMap} from '../getVersionsColors';

describe('parseVersionsToVersionsDataMap', () => {
    test('assigns one color family to on-prem builds from the same release line', () => {
        const versionsDataMap = parseVersionsToVersionsDataMap([
            '25.4.1.6.08bebbe',
            '25.4.1.ent.6.454b74b',
        ]);

        const openSourceVersionData = versionsDataMap.get('25.4.1.6');
        const enterpriseVersionData = versionsDataMap.get('25.4.1.ent.6');

        expect(openSourceVersionData).toEqual(
            expect.objectContaining({
                color: expect.any(String),
                majorIndex: expect.any(Number),
                minorIndex: expect.any(Number),
            }),
        );
        expect(enterpriseVersionData).toEqual(
            expect.objectContaining({
                color: expect.any(String),
                majorIndex: openSourceVersionData?.majorIndex,
                minorIndex: expect.any(Number),
            }),
        );
        expect(openSourceVersionData?.color).not.toBe(DEFAULT_COLOR);
        expect(enterpriseVersionData?.color).not.toBe(DEFAULT_COLOR);
        expect(enterpriseVersionData?.minorIndex).not.toBe(openSourceVersionData?.minorIndex);
    });

    test('orders on-prem builds by numeric build number', () => {
        const versionsDataMap = parseVersionsToVersionsDataMap([
            '25.4.1.10.08bebbe',
            '25.4.1.100.454b74b',
        ]);

        expect(versionsDataMap.get('25.4.1.100')?.minorIndex).toBe(0);
        expect(versionsDataMap.get('25.4.1.10')?.minorIndex).toBe(1);
    });

    test('groups suffix-bearing on-prem builds under their release line', () => {
        const version = '25.3.1.25-hotfixblobstorage-1';
        const versionsDataMap = parseVersionsToVersionsDataMap([`${version}.08bebbe`]);
        const versionData = versionsDataMap.get(version);

        expect(versionData).toEqual(
            expect.objectContaining({
                color: expect.any(String),
                majorIndex: expect.any(Number),
                minorIndex: 0,
            }),
        );
        expect(versionData?.color).not.toBe(DEFAULT_COLOR);
    });

    test('groups and orders alphanumeric on-prem builds under their release line', () => {
        const versionsDataMap = parseVersionsToVersionsDataMap([
            '24.3.1.10a.08bebbe',
            '24.3.1.10rc1.454b74b',
            '24.3.1.100a.deadbee',
        ]);

        const letterSuffixVersionData = versionsDataMap.get('24.3.1.10a');
        const prereleaseVersionData = versionsDataMap.get('24.3.1.10rc1');
        const newerBuildVersionData = versionsDataMap.get('24.3.1.100a');

        expect(letterSuffixVersionData).toEqual(
            expect.objectContaining({
                color: expect.any(String),
                majorIndex: expect.any(Number),
                minorIndex: expect.any(Number),
            }),
        );
        expect(prereleaseVersionData).toEqual(
            expect.objectContaining({
                color: expect.any(String),
                majorIndex: letterSuffixVersionData?.majorIndex,
                minorIndex: expect.any(Number),
            }),
        );
        expect(newerBuildVersionData).toEqual(
            expect.objectContaining({
                color: expect.any(String),
                majorIndex: letterSuffixVersionData?.majorIndex,
                minorIndex: 0,
            }),
        );
        expect(letterSuffixVersionData?.color).not.toBe(DEFAULT_COLOR);
        expect(prereleaseVersionData?.color).not.toBe(DEFAULT_COLOR);
    });

    test('orders on-prem release lines newest-first', () => {
        const versionsDataMap = parseVersionsToVersionsDataMap([
            '25.3.1.1.08bebbe',
            '25.4.1.1.454b74b',
        ]);

        expect(versionsDataMap.get('25.4.1.1')?.majorIndex).toBe(0);
        expect(versionsDataMap.get('25.3.1.1')?.majorIndex).toBe(1);
    });
});
