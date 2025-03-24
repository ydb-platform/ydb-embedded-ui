import type {Actions} from '../../../types/api/query';
import type {QueryAction, QueryMode, QuerySyntax} from '../../../types/store/query';
import type {
    QueryResponseChunk,
    SessionChunk,
    StreamDataChunk,
    StreamingChunk,
} from '../../../types/store/streaming';

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

export function isSessionChunk(content: StreamingChunk): content is SessionChunk {
    return content?.meta?.event === 'SessionCreated';
}

export function isStreamDataChunk(content: StreamingChunk): content is StreamDataChunk {
    return content?.meta?.event === 'StreamData';
}

export function isQueryResponseChunk(content: StreamingChunk): content is QueryResponseChunk {
    return content?.meta?.event === 'QueryResponse';
}

export function isKeepAliveChunk(content: StreamingChunk): content is SessionChunk {
    return content?.meta?.event === 'KeepAlive';
}
