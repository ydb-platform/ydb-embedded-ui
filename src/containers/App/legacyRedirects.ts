import type {Location} from 'history';

type LegacyRedirectLocation = Pick<Location, 'pathname' | 'search' | 'hash'>;

function makeRedirectLocation(location: LegacyRedirectLocation, pathname: string) {
    return {
        pathname,
        search: location.search,
        hash: location.hash,
    };
}

export function getLegacyClusterTenantsRedirect(location: LegacyRedirectLocation) {
    return makeRedirectLocation(
        location,
        location.pathname.replace(/\/cluster\/tenants(\/|$)/, '/cluster/databases$1'),
    );
}

export function getLegacyTenantRedirect(location: LegacyRedirectLocation) {
    return makeRedirectLocation(
        location,
        location.pathname.replace(/\/tenant(\/|$)/, '/database$1'),
    );
}
