import {cn} from '../../../../../../utils/cn';
import {parseQueryError} from '../../../../../../utils/query';
import {ResultIssues} from '../../../Issues/Issues';
import {isQueryCancelledError} from '../../../utils/isQueryCancelledError';

import './QueryResultError.scss';

const b = cn('ydb-query-result-error ');

export function QueryResultError({error}: {error: unknown}) {
    const parsedError = parseQueryError(error);

    // "Stopped" message is displayd in QueryExecutionStatus
    // There is no need to display "Query is cancelled" message too
    if (!parsedError || isQueryCancelledError(error)) {
        return null;
    }

    if (typeof parsedError === 'object') {
        return <ResultIssues data={parsedError} />;
    }

    return <div className={b('message')}>{parsedError}</div>;
}
