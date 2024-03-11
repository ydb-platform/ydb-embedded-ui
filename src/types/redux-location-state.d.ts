/* eslint-disable @typescript-eslint/no-duplicate-imports */
declare module 'redux-location-state' {
    import type {Middleware, Reducer, Store} from '@reduxjs/toolkit';
    import type {History, Location} from 'History';

    export function listenForHistoryChange(store: Store, history: History): void;

    export interface ParamSetup {
        [key: string]: {
            [key: string]: {
                stateKey: string;
                type?: 'array' | 'bool' | 'number' | 'object' | 'date';
                initialState?: any;
                options?: {
                    shouldPush?: boolean;
                    isFlags?: boolean;
                    delimiter?: string;
                    keepOrder?: boolean;
                    serialize?: (value: any) => string;
                    parse?: (value: string) => any;
                };
            };
        };
    }

    export interface LocationWithQuery extends Location {
        query: Record<string, any>;
    }
    export function createReduxLocationActions<S = any, A extends Action = AnyAction, P = S>(
        paramSetup: ParamSetup,
        mergeLocationToState: any,
        history: History,
        rootReducer: Reducer<S, A, P>,
        overwriteLocationHandling: (
            setupObject: ParamSetup,
            nextState: S,
            location: Location,
        ) => {location: Location; shouldPush: boolean},
    ): {
        locationMiddleware: Middleware;
    };
}

declare module 'redux-location-state/lib/parseQuery' {
    import {ParamSetup} from 'redux-location-state';
    export function parseQuery(setupObject: ParamSetup, payload: any): Record<string, any>;
}

declare module 'redux-location-state/lib/constants' {
    export const LOCATION_PUSH: 'REDUX-LOCATION-POP-ACTION';
    export const LOCATION_POP: 'REDUX-LOCATION-PUSH-ACTION';
}

declare module 'redux-location-state/lib/helpers' {
    import type {ParamSetup} from 'redux-location-state';
    import type {Location} from 'History';
    export function getMatchingDeclaredPath(setupObject: ParamSetup, location: Location): string;
}

declare module 'redux-location-state/lib/stateToParams' {
    import type {Location} from 'History';
    import type {ParamSetup} from 'redux-location-state';
    export function stateToParams<S, L extends Location>(
        setupObject: ParamSetup,
        state: S,
        location: L,
    ): {location: L; shouldPush: boolean};
}
