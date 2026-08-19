import {getMajorVersion, getMinorVersion} from '../parseVersion';

describe.each([
    {
        edition: 'opensource',
        releaseVersion: '25.4.1.6',
        runtimeVersion: '25.4.1.6.08bebbe',
    },
    {
        edition: 'enterprise',
        releaseVersion: '25.4.1.ent.6',
        runtimeVersion: '25.4.1.ent.6.08bebbe',
    },
])('$edition on-prem versions', ({releaseVersion, runtimeVersion}) => {
    test('removes the runtime commit hash and preserves the build number', () => {
        expect(getMinorVersion(runtimeVersion)).toBe(releaseVersion);
        expect(getMinorVersion(releaseVersion)).toBe(releaseVersion);
    });

    test('groups the build under its release line', () => {
        expect(getMajorVersion(runtimeVersion)).toBe('25.4.1');
        expect(getMajorVersion(releaseVersion)).toBe('25.4.1');
    });
});
