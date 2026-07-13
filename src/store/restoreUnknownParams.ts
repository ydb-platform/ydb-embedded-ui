import type {Location} from 'history';
import each from 'lodash/each';
import keys from 'lodash/keys';
import qs from 'qs';
import type {ParamSetup} from 'redux-location-state';
import {getMatchingDeclaredPath} from 'redux-location-state/lib/helpers';

import {normalizeSingleValueQueryParams, omitVolatileQueryParams} from '../utils/queryParams';

export function restoreUnknownParams(
    location: Location,
    prevLocation: Location,
    paramSetup: ParamSetup,
) {
    const {search, ...rest} = location;
    const params = normalizeSingleValueQueryParams(
        omitVolatileQueryParams(qs.parse(prevLocation.search.slice(1))),
    );

    const declaredPath = getMatchingDeclaredPath(paramSetup, location);
    const entries = declaredPath && paramSetup[declaredPath];

    each(keys(entries), (param) => {
        delete params[param];
    });
    each(keys(paramSetup.global || {}), (param) => {
        delete params[param];
    });

    const restoredParams = qs.stringify(params, {
        arrayFormat: 'repeat',
        encoder: encodeURIComponent,
    });

    if (!restoredParams) {
        return {search, ...rest};
    }

    const searchDelimiter = search.startsWith('?') ? '&' : '?';

    return {search: `${search}${searchDelimiter}${restoredParams}`, ...rest};
}
