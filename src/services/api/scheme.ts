import type {SchemaPathParam} from '../../types/api/common';

import {BaseYdbAPI} from './base';

export class SchemeAPI extends BaseYdbAPI {
    createSchemaDirectory(
        {database, path}: {database: string; path: SchemaPathParam},
        {signal}: {signal?: AbortSignal} = {},
    ) {
        return this.post<{test: string}>(
            this.getPath('/scheme/directory'),
            {},
            {
                database,
                path: this.getSchemaPath(path),
            },
            {
                requestConfig: {signal},
            },
        );
    }
}
