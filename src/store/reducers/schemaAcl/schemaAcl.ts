import type {Reducer} from '@reduxjs/toolkit';

import {createApiRequest, createRequestActionTypes} from '../../utils';

import type {SchemaAclAction, SchemaAclState} from './types';

export const FETCH_SCHEMA_ACL = createRequestActionTypes('schemaAcl', 'FETCH_SCHEMA_ACL');
const SET_ACL_WAS_NOT_LOADED = 'schemaAcl/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

const schemaAcl: Reducer<SchemaAclState, SchemaAclAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_SCHEMA_ACL.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_SCHEMA_ACL.SUCCESS: {
            const acl = action.data.Common?.ACL;
            const owner = action.data.Common?.Owner;

            return {
                ...state,
                acl,
                owner,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_SCHEMA_ACL.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_ACL_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

export function getSchemaAcl({path}: {path: string}) {
    return createApiRequest({
        request: window.api.getSchemaAcl({path}),
        actions: FETCH_SCHEMA_ACL,
    });
}

export const setAclWasNotLoaded = () => {
    return {
        type: SET_ACL_WAS_NOT_LOADED,
    } as const;
};

export default schemaAcl;
