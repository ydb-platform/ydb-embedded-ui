import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import _ from 'lodash';

const FETCH_SCHEMA_ACL = createRequestActionTypes('schemaAcl', 'FETCH_SCHEMA_ACL');

const schemaAcl = function z(state = {loading: false, wasLoaded: false, acl: undefined}, action) {
    switch (action.type) {
        case FETCH_SCHEMA_ACL.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_SCHEMA_ACL.SUCCESS: {
            return {
                ...state,
                error: undefined,
                acl: _.get(action.data, 'Common.ACL'),
                owner: _.get(action.data, 'Common.Owner'),
                loading: false,
                wasLoaded: true,
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

export function getSchemaAcl({path}) {
    return createApiRequest({
        request: window.api.getSchemaAcl({path}),
        actions: FETCH_SCHEMA_ACL,
    });
}

export default schemaAcl;
