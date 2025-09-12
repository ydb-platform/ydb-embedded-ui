import type {SchemaPathParam} from '../api/common';

export interface TabletsApiRequestParams {
    nodeId?: string | number;
    path?: SchemaPathParam;
    database?: string;
    filter?: string;
}
