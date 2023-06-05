import type {Reducer} from 'redux';

import '../../../services/api';
import {createRequestActionTypes, createApiRequest} from '../../utils';

import type {SchemaAclAction, SchemaAclState} from './types';

export const FETCH_SCHEMA_ACL = createRequestActionTypes('schemaAcl', 'FETCH_SCHEMA_ACL');

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
            return {
                ...state,
                error: action.error,
                loading: false,
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

export default schemaAcl;
