import type {TUserToken} from '../../../../types/api/whoami';
import {prepareTenants} from '../../tenants/utils';
import {getDatabaseAvailability, isTenantRequestReady, matchesDatabase} from '../availability';
import type {ControlPlaneTenant, RuntimeTenant} from '../availability';

const raw = {Id: 'id', Name: '/db', ControlPlane: {id: 'id'}};
const cp: ControlPlaneTenant = {...raw, availability: 'control-plane'};
const runtime: RuntimeTenant = {...prepareTenants([raw])[0], availability: 'runtime'};
const whoamiData: TUserToken = {UserSID: 'user', IsViewerAllowed: true};
const operational = {status: 400, data: 'Failed to resolve database nodes'};

const ready = {
    database: '/db',
    composite: true,
    whoamiData,
    clusterInfoResolved: true,
};

describe('getDatabaseAvailability', () => {
    test.each(['id', '/db'])('selects CP by its ID or canonical path: %s', (database) => {
        expect(getDatabaseAvailability({...ready, database, tenantData: cp})).toEqual({
            status: 'control-plane',
            tenant: cp,
        });
    });

    test('matches the CP ID when the Viewer ID differs', () => {
        const tenant = {...cp, Id: 'viewer-id', ControlPlane: {id: 'cp-id'}};
        expect(matchesDatabase(tenant, 'cp-id')).toBe(true);
        expect(matchesDatabase(tenant, 'other-id')).toBe(false);
    });

    test('never matches the CP display name and requires a CP identity', () => {
        expect(
            getDatabaseAvailability({
                ...ready,
                database: 'display',
                tenantData: {...cp, ControlPlane: {id: 'id', name: 'display'}},
            }).status,
        ).toBe('unavailable');
        expect(getDatabaseAvailability({...ready, tenantData: {...cp, ControlPlane: {}}})).toEqual({
            status: 'unavailable',
            error: {status: 503, data: undefined},
        });
    });

    test('runtime data is exposed only with a confirmed whoami', () => {
        expect(getDatabaseAvailability({...ready, tenantData: runtime})).toEqual({
            status: 'runtime',
            tenant: runtime,
        });
        expect(
            getDatabaseAvailability({
                ...ready,
                whoamiData: undefined,
                whoamiError: operational,
                tenantData: {...runtime, ControlPlane: undefined},
            }),
        ).toEqual({status: 'runtime', tenant: undefined});
    });

    test('a healthy composite with an operational whoami failure shows CP', () => {
        expect(
            getDatabaseAvailability({...ready, whoamiError: operational, tenantData: runtime})
                .status,
        ).toBe('control-plane');
        expect(
            getDatabaseAvailability({
                ...ready,
                database: '/other',
                whoamiError: operational,
                tenantData: runtime,
            }).status,
        ).toBe('runtime');
    });

    test('operational capabilities failure does not block CP', () => {
        expect(
            getDatabaseAvailability({...ready, capabilitiesError: operational, tenantData: cp})
                .status,
        ).toBe('control-plane');
    });

    test.each(['tenantError', 'whoamiError', 'capabilitiesError'])(
        '%s authorization failure wins over retained data',
        (source) => {
            const error = {status: 403};
            expect(getDatabaseAvailability({...ready, tenantData: cp, [source]: error})).toEqual({
                status: 'access-error',
                error,
            });
        },
    );

    test('a failed request never authorizes retained CP, but keeps retained runtime', () => {
        expect(
            getDatabaseAvailability({...ready, tenantData: cp, tenantError: operational}),
        ).toEqual({status: 'unavailable', error: operational});
        expect(
            getDatabaseAvailability({...ready, tenantData: runtime, tenantError: operational}),
        ).toEqual({status: 'runtime', tenant: runtime});
    });

    test('a cold composite failure keeps the regular page', () => {
        expect(getDatabaseAvailability({...ready, tenantError: operational})).toEqual({
            status: 'runtime',
            tenant: undefined,
        });
        expect(getDatabaseAvailability(ready)).toEqual({status: 'loading'});
    });

    test('without the composite API the regular data flow is used', () => {
        expect(getDatabaseAvailability({...ready, composite: false})).toEqual({status: 'legacy'});
    });
});

describe('isTenantRequestReady', () => {
    test.each([
        ['pending whoami', undefined, undefined, true, false],
        ['pending cluster settings for a Viewer', {IsViewerAllowed: true}, undefined, false, false],
        ['loaded cluster settings for a Viewer', {IsViewerAllowed: true}, undefined, true, true],
        [
            'non-Viewer uses the default API policy',
            {IsViewerAllowed: false},
            undefined,
            false,
            true,
        ],
        ['operational whoami failure uses the default policy', undefined, operational, false, true],
        ['whoami 401', undefined, {status: 401}, true, false],
        ['whoami 403 with retained data', {IsViewerAllowed: true}, {status: 403}, true, false],
    ])('%s', (_name, data, whoamiError, clusterInfoResolved, expected) => {
        expect(
            isTenantRequestReady({
                whoamiData: data as TUserToken | undefined,
                whoamiError,
                clusterInfoResolved,
            }),
        ).toBe(expected);
    });
});
