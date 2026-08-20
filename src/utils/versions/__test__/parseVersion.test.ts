import {getMajorVersion, getMinorVersion} from '../parseVersion';

describe.each([
    {
        edition: 'opensource',
        majorVersion: '25.4.1',
        releaseVersion: '25.4.1.6',
        runtimeVersion: '25.4.1.6.08bebbe',
    },
    {
        edition: 'enterprise',
        majorVersion: '25.4.1',
        releaseVersion: '25.4.1.ent.6',
        runtimeVersion: '25.4.1.ent.6.08bebbe',
    },
    {
        edition: 'letter-suffixed opensource',
        majorVersion: '24.3.1',
        releaseVersion: '24.3.1.10a',
        runtimeVersion: '24.3.1.10a.08bebbe',
    },
    {
        edition: 'prerelease opensource',
        majorVersion: '24.3.1',
        releaseVersion: '24.3.1.10rc1',
        runtimeVersion: '24.3.1.10rc1.08bebbe',
    },
])('$edition on-prem versions', ({majorVersion, releaseVersion, runtimeVersion}) => {
    test('removes the runtime commit hash and preserves the build number', () => {
        expect(getMinorVersion(runtimeVersion)).toBe(releaseVersion);
        expect(getMinorVersion(releaseVersion)).toBe(releaseVersion);
    });

    test('groups the build under its release line', () => {
        expect(getMajorVersion(runtimeVersion)).toBe(majorVersion);
        expect(getMajorVersion(releaseVersion)).toBe(majorVersion);
    });
});
