import type {Actions} from '../../../types/api/query';
import type {QueryAction, QueryMode, QuerySyntax} from '../../../types/store/query';

import type {QueryInHistory} from './types';

export function getActionAndSyntaxFromQueryMode(
    baseAction: QueryAction = 'execute',
    queryMode: QueryMode = 'query',
) {
    let action: Actions = baseAction;
    let syntax: QuerySyntax = 'yql_v1';

    if (queryMode === 'pg') {
        action = `${baseAction}-query`;
        syntax = 'pg';
    } else if (queryMode) {
        action = `${baseAction}-${queryMode}`;
    }

    return {action, syntax};
}

export function getQueryInHistory(rawQuery: string | QueryInHistory) {
    if (typeof rawQuery === 'string') {
        return {
            queryText: rawQuery,
        };
    }
    return rawQuery;
}
