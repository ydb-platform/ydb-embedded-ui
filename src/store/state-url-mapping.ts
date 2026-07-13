import type {Action, Reducer, UnknownAction} from '@reduxjs/toolkit';
import type {History, Location} from 'history';
import merge from 'lodash/merge';
import type {LocationWithQuery, ParamSetup} from 'redux-location-state';
import {createReduxLocationActions} from 'redux-location-state';
import {LOCATION_POP, LOCATION_PUSH} from 'redux-location-state/lib/constants';
import {parseQuery} from 'redux-location-state/lib/parseQuery';
import {stateToParams} from 'redux-location-state/lib/stateToParams';

import {initialState as initialHeatmapState} from './reducers/heatmap';
import {initialState as initialTenantState} from './reducers/tenant/tenant';
import {restoreUnknownParams} from './restoreUnknownParams';

const databasePageParams = {
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
} as const;

export const paramSetup = {
    // Do not delete, without `global` params redux-location-state goes crazy
    global: {},
    // Database page (current URL).
    '/database': databasePageParams,
    '/*/database': databasePageParams,
    // Legacy `/tenant` URL — kept so query params resolve correctly during the
    // brief moment before the redirect to `/database` runs.
    '/tenant': databasePageParams,
    '/*/tenant': databasePageParams,
} as const;

function mergeLocationToState<S>(state: S, location: Pick<LocationWithQuery, 'query'>): S {
    return merge({}, state, location.query);
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
            location = restoreUnknownParams(location, prevLocation, setupObject);
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
