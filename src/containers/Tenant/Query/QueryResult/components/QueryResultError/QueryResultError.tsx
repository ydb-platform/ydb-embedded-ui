import {ResponseError} from '../../../../../../components/Errors/ResponseError/ResponseError';
import {cn} from '../../../../../../utils/cn';
import {parseQueryError} from '../../../../../../utils/query';
import {ResultIssues} from '../../../Issues/Issues';
import {isQueryCancelledError} from '../../../utils/isQueryCancelledError';

import './QueryResultError.scss';

const b = cn('ydb-query-result-error');

export function QueryResultError({error}: {error: unknown}) {
    // "Stopped" message is displayed in QueryExecutionStatus
    // There is no need to display "Query is cancelled" message too
    if (isQueryCancelledError(error)) {
        return null;
    }

    const parsedError = parseQueryError(error);

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
