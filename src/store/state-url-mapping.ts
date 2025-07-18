import type {Action, Reducer, UnknownAction} from '@reduxjs/toolkit';
import type {History, Location} from 'history';
import each from 'lodash/each';
import keys from 'lodash/keys';
import merge from 'lodash/merge';
import qs from 'qs';
import type {LocationWithQuery, ParamSetup} from 'redux-location-state';
import {createReduxLocationActions} from 'redux-location-state';
import {LOCATION_POP, LOCATION_PUSH} from 'redux-location-state/lib/constants';
import {getMatchingDeclaredPath} from 'redux-location-state/lib/helpers';
import {parseQuery} from 'redux-location-state/lib/parseQuery';
import {stateToParams} from 'redux-location-state/lib/stateToParams';

import {initialState as initialHeatmapState} from './reducers/heatmap';
import {initialState as initialSettingsState} from './reducers/settings/settings';
import {initialState as initialTenantState} from './reducers/tenant/tenant';

export const paramSetup = {
    global: {
        problemFilter: {
            stateKey: 'settings.problemFilter',
            initialState: initialSettingsState.problemFilter,
        },
    },
    '/tenant': {
        sort: {
            stateKey: 'heatmap.sort',
            initialState: initialHeatmapState.sort,
            type: 'bool',
        },
        heatmap: {
            stateKey: 'heatmap.heatmap',
            initialState: initialHeatmapState.heatmap,
            type: 'bool',
        },
        currentMetric: {
            stateKey: 'heatmap.currentMetric',
            initialState: initialHeatmapState.currentMetric,
        },
        tenantPage: {
            stateKey: 'tenant.tenantPage',
        },
        queryTab: {
            stateKey: 'tenant.queryTab',
        },
        diagnosticsTab: {
            stateKey: 'tenant.diagnosticsTab',
        },
        summaryTab: {
            stateKey: 'tenant.summaryTab',
        },
        metricsTab: {
            stateKey: 'tenant.metricsTab',
            initialState: initialTenantState.metricsTab,
        },
        shardsMode: {
            stateKey: 'shardsWorkload.mode',
        },
        shardsDateFrom: {
            stateKey: 'shardsWorkload.from',
        },
        shardsDateTo: {
            stateKey: 'shardsWorkload.to',
        },
        topQueriesDateFrom: {
            stateKey: 'executeTopQueries.from',
        },
        topQueriesDateTo: {
            stateKey: 'executeTopQueries.to',
        },
        selectedConsumer: {
            stateKey: 'partitions.selectedConsumer',
        },
    },
    '/cluster/tenants': {
        search: {
            stateKey: 'tenants.searchValue',
            initialState: '',
        },
    },
} as const;

function mergeLocationToState<S>(state: S, location: Pick<LocationWithQuery, 'query'>): S {
    return merge({}, state, location.query);
}

function restoreUnknownParams(location: Location, prevLocation: Location) {
    const {search, ...rest} = location;
    const params = qs.parse(prevLocation.search.slice(1));

    // figure out which path key inside paramSetup matches location.pathname
    const declaredPath = getMatchingDeclaredPath(paramSetup, location);
    const entries = declaredPath && paramSetup[declaredPath as keyof typeof paramSetup];

    // remove params which are mapped for this page
    each(keys(entries), (param) => {
        delete params[param];
    });
    // and globally
    each(keys(paramSetup.global || {}), (param) => {
        delete params[param];
    });

    const restoredParams = qs.stringify(params, {encoder: encodeURIComponent});
    const searchDelimiter = search.startsWith('?') ? '&' : '?';

    return {search: `${search}${searchDelimiter}${restoredParams}`, ...rest};
}

let prevSearchStringFromState = '';

// Keep intact params that are not present in paramSetup
function overwriteLocationHandling<S>(
    setupObject: ParamSetup,
    nextState: S,
    prevLocation: Location,
) {
    const nextLocation = stateToParams(setupObject, nextState, prevLocation);
    let {location} = nextLocation;

    if (location.search === prevSearchStringFromState) {
        // nothing to do here, state parts represented in query params didn't change
        return {location: prevLocation, shouldPush: false};
    } else {
        const searchRe = /\?\w+/;
        prevSearchStringFromState = location.search;

        if (searchRe.test(prevLocation.search)) {
            location = restoreUnknownParams(location, prevLocation);
        }

        return {...nextLocation, location};
    }
}

function makeReducersWithLocation<S, A extends UnknownAction, P = A>(
    setupObject: ParamSetup,
    mapLocationToState: (state: S, location: LocationWithQuery) => S,
    rootReducer: Reducer<S, A, P>,
): Reducer<S, A, P> {
    const locationReducer = (state: S, action: UnknownAction) => {
        const {type, payload} = action;
        if (!payload) {
            return state;
        }
        if (LOCATION_POP === type || LOCATION_PUSH === type) {
            const location = payload as LocationWithQuery;
            location.query = parseQuery(setupObject, payload);
            return mapLocationToState(state, location);
        }
        return state;
    };

    return (state, action) => {
        const postReducerState = rootReducer(state, action);
        const postLocationState = locationReducer(postReducerState, action);
        const hasChanged = postLocationState !== state;

        return hasChanged ? postLocationState : (state as S);
    };
}

export default function getLocationMiddleware<S = any, A extends Action = UnknownAction, P = S>(
    history: History,
    rootReducer: Reducer<S, A, P>,
) {
    const {locationMiddleware} = createReduxLocationActions(
        paramSetup,
        mergeLocationToState,
        history,
        rootReducer,
        overwriteLocationHandling,
    );
    const reducersWithLocation = makeReducersWithLocation(
        paramSetup,
        mergeLocationToState,
        rootReducer,
    );
    return {locationMiddleware, reducersWithLocation};
}
