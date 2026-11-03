import {prepareTenants} from '../../tenants/utils';
import {
    getDatabaseAvailability,
    getRuntimeTenant,
    isTenantRequestReady,
    matchesDatabase,
} from '../availability';
import type {TenantInfo} from '../availability';

const raw = {Id: 'id', Name: '/db', ControlPlane: {id: 'id'}};
const cp: TenantInfo = {...raw, availability: 'control-plane'};
const runtime: TenantInfo = {...prepareTenants([raw])[0], availability: 'runtime'};
const operational = {status: 400, data: 'Failed to resolve database nodes'};

describe('database availability', () => {
    test.each(['id', '/db'])('matches CP by verified ID or canonical path: %s', (database) => {
        expect(matchesDatabase(cp, database)).toBe(true);
        expect(getDatabaseAvailability({database, tenant: cp}).controlPlaneOnly).toBe(true);
    });
    test.each([cp, runtime])(
        'matches CP ID when the Viewer ID differs: $availability',
        (tenant) => {
            const data = {...tenant, Id: 'viewer-id', ControlPlane: {id: 'cp-id'}};
            expect(matchesDatabase(data, 'cp-id')).toBe(true);
            expect(
                getDatabaseAvailability({
                    database: 'cp-id',
                    tenant: data,
                    whoamiError: operational,
                }).controlPlaneOnly,
            ).toBe(true);
            expect(matchesDatabase(data, 'other-id')).toBe(false);
        },
    );
    test('requires CP identity and never matches its display name', () => {
        expect(
            getDatabaseAvailability({
                database: 'display',
                tenant: {...cp, ControlPlane: {id: 'id', name: 'display'}},
            }).controlPlaneOnly,
        ).toBe(false);
        expect(
            getDatabaseAvailability({database: '/db', tenant: {...cp, ControlPlane: {}}})
                .controlPlaneOnly,
        ).toBe(false);
    });
    test('allows CP with a healthy composite and operational whoami failure', () => {
        expect(
            getDatabaseAvailability({database: '/db', tenant: runtime, whoamiError: operational})
                .controlPlaneOnly,
        ).toBe(true);
        expect(
            getDatabaseAvailability({database: '/other', tenant: runtime, whoamiError: operational})
                .controlPlaneOnly,
        ).toBe(false);
    });
    test('operational/pending capabilities do not independently block authorized CP', () => {
        expect(
            getDatabaseAvailability({database: '/db', tenant: cp, capabilitiesError: operational})
                .controlPlaneOnly,
        ).toBe(true);
        expect(getDatabaseAvailability({database: '/db', tenant: cp}).controlPlaneOnly).toBe(true);
        expect(
            getDatabaseAvailability({
                database: '/db',
                tenant: runtime,
                capabilitiesError: operational,
            }).controlPlaneOnly,
        ).toBe(false);
    });
    test.each(['tenantError', 'whoamiError', 'capabilitiesError'])(
        '%s authorization failure takes precedence over retained CP',
        (source) => {
            const error = {status: 403};
            expect(getDatabaseAvailability({database: '/db', tenant: cp, [source]: error})).toEqual(
                {authorizationError: error, controlPlaneOnly: false},
            );
        },
    );
    test('a failed composite never authorizes old CP and recovery restores runtime mode', () => {
        expect(
            getDatabaseAvailability({database: '/db', tenant: cp, tenantError: operational})
                .controlPlaneOnly,
        ).toBe(false);
        expect(getDatabaseAvailability({database: '/db', tenant: runtime}).controlPlaneOnly).toBe(
            false,
        );
    });
});

describe('selected database API readiness', () => {
    test.each([
        ['pending whoami even when cluster query is skipped', undefined, undefined, true, false],
        ['pending permitted cluster settings', {IsViewerAllowed: true}, undefined, false, false],
        ['permitted loaded settings', {IsViewerAllowed: true}, undefined, true, true],
        [
            'non-viewer role uses default API policy',
            {IsViewerAllowed: false},
            undefined,
            true,
            true,
        ],
        ['operational whoami uses default API policy', undefined, operational, true, true],
        ['whoami401 blocks', undefined, {status: 401}, true, false],
        [
            'whoami403 blocks with cached permission',
            {IsViewerAllowed: true},
            {status: 403},
            true,
            false,
        ],
        ['redirect blocks', undefined, {status: 401, data: {authUrl: '/login'}}, true, false],
    ])('%s', (_name, whoamiData, whoamiError, clusterInfoResolved, expected) => {
        expect(isTenantRequestReady({whoamiData, whoamiError, clusterInfoResolved})).toBe(expected);
    });
});

test('retained healthy tenant survives an operational tenant error, but cannot authorize CP', () => {
    const availability = getDatabaseAvailability({
        database: '/db',
        tenant: runtime,
        tenantError: operational,
    });
    expect(availability.controlPlaneOnly).toBe(false);
    expect(
        getRuntimeTenant({...availability, tenant: runtime, whoamiData: {IsViewerAllowed: true}}),
    ).toBe(runtime);
    expect(
        getRuntimeTenant({
            ...availability,
            tenant: runtime,
            whoamiData: {IsViewerAllowed: true},
            whoamiError: operational,
        }),
    ).toBeUndefined();
    expect(
        getRuntimeTenant({
            ...availability,
            tenant: runtime,
            whoamiData: {IsViewerAllowed: true},
            authorizationError: {status: 403},
        }),
    ).toBeUndefined();
});
