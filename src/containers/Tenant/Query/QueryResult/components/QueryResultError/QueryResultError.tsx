import {ResponseError} from '../../../../../../components/Errors/ResponseError/ResponseError';
import type {QuerySourcePosition} from '../../../../../../store/reducers/query/types';
import {cn} from '../../../../../../utils/cn';
import {parseQueryError} from '../../../../../../utils/query';
import {ResultIssues} from '../../../Issues/Issues';
import {offsetErrorResponsePositions} from '../../../Issues/helpers';
import {isQueryCancelledError} from '../../../utils/isQueryCancelledError';

import './QueryResultError.scss';

const b = cn('ydb-query-result-error');

interface QueryResultErrorProps {
    error: unknown;
    sourcePosition?: QuerySourcePosition;
}

export function QueryResultError({error, sourcePosition}: QueryResultErrorProps) {
    // "Stopped" message is displayed in QueryExecutionStatus
    // There is no need to display "Query is cancelled" message too
    if (isQueryCancelledError(error)) {
        return null;
    }

    const rawParsedError = parseQueryError(error);
    const parsedError =
        sourcePosition && rawParsedError !== null && typeof rawParsedError === 'object'
            ? offsetErrorResponsePositions(rawParsedError, sourcePosition)
            : rawParsedError;

    // Query-specific errors with issues (e.g. syntax errors) — show ResultIssues
    if (typeof parsedError === 'object') {
        return (
            <div className={b('message')}>
                <ResultIssues data={parsedError} />
            </div>
        );
    }

    // All other errors (network, streaming, HTTP) — show ResponseError with details
    return (
        <div className={b('message')}>
            <ResponseError error={error} />
        </div>
    );
}
