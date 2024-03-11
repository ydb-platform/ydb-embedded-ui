import {LocationWithQuery, ParamSetup, createReduxLocationActions} from 'redux-location-state';
import qs from 'qs';
import _ from 'lodash';
import {stateToParams} from 'redux-location-state/lib/stateToParams';
import {parseQuery} from 'redux-location-state/lib/parseQuery';
import {LOCATION_PUSH, LOCATION_POP} from 'redux-location-state/lib/constants';
import {getMatchingDeclaredPath} from 'redux-location-state/lib/helpers';

import {initialState as initialSettingsState} from './reducers/settings/settings';
import {initialState as initialHeatmapState} from './reducers/heatmap';

import type {History, Location} from 'history';
import type {Action, Reducer, UnknownAction} from '@reduxjs/toolkit';

const paramSetup: ParamSetup = {
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
        schema: {
            stateKey: 'schema.currentSchemaPath',
        },
        stateFilter: {
            stateKey: 'tablets.stateFilter',
            type: 'array',
        },
        typeFilter: {
            stateKey: 'tablets.typeFilter',
            type: 'array',
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
        },
        shardsMode: {
            stateKey: 'shardsWorkload.filters.mode',
        },
        shardsDateFrom: {
            stateKey: 'shardsWorkload.filters.from',
            type: 'number',
        },
        shardsDateTo: {
            stateKey: 'shardsWorkload.filters.to',
            type: 'number',
        },
        topQueriesDateFrom: {
            stateKey: 'executeTopQueries.filters.from',
            type: 'number',
        },
        topQueriesDateTo: {
            stateKey: 'executeTopQueries.filters.to',
            type: 'number',
        },
        selectedConsumer: {
            stateKey: 'partitions.selectedConsumer',
        },
    },
};

function mergeLocationToState<S>(state: S, location: Pick<LocationWithQuery, 'query'>): S {
    return _.merge({}, state, location.query);
}

function restoreUnknownParams(location: Location, prevLocation: Location) {
    const {search, ...rest} = location;
    const params = qs.parse(prevLocation.search.slice(1));

    // figure out which path key inside paramSetup matches location.pathname
    const declaredPath = getMatchingDeclaredPath(paramSetup, location);
    const entries = declaredPath && paramSetup[declaredPath];

    // remove params which are mapped for this page
    _.each(_.keys(entries), (param) => {
        delete params[param];
    });
    // and globally
    _.each(_.keys(paramSetup.global || {}), (param) => {
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
