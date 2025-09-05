import {BaseYdbAPI} from './base';

export class SchemeAPI extends BaseYdbAPI {
    createSchemaDirectory(
        {database, path}: {database: string; path: string},
        {signal}: {signal?: AbortSignal} = {},
    ) {
        return this.post<{test: string}>(
            this.getPath('/scheme/directory'),
            {},
            {
                database,
                path: this.getSchemaPath({path, database}),
            },
            {
                requestConfig: {signal},
            },
        );
    }
}
