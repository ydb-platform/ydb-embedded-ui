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
});
