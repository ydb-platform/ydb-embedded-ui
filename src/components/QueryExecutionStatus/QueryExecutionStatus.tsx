import React from 'react';

import {duration} from '@gravity-ui/date-utils';

import {isQueryCancelledError} from '../../containers/Tenant/Query/utils/isQueryCancelledError';
import {selectQueryDuration} from '../../store/reducers/query/query';
import type {QueryExecutionStatusType, StreamingStatus} from '../../store/reducers/query/types';
import {HOUR_IN_SECONDS, SECOND_IN_MS} from '../../utils/constants';
import {useTypedSelector} from '../../utils/hooks';
import {isAxiosError} from '../../utils/response';
import {QueryExecutionLabel} from '../QueryExecutionLabel';

import {useElapsedDuration} from './useElapsedDuration';

interface QueryExecutionStatusProps {
    className?: string;
    error?: unknown;
    loading?: boolean;
    streamingStatus?: StreamingStatus;
}

function getQueryExecutionStatus(error: unknown, loading?: boolean): QueryExecutionStatusType {
    if (loading) {
        return 'loading';
    }
    if (isAxiosError(error) && error.code === 'ECONNABORTED') {
        return 'aborted';
    }
    if (isQueryCancelledError(error)) {
        return 'stopped';
    }
    if (error) {
        return 'failed';
    }
    return 'completed';
}

export const QueryExecutionStatus = ({
    className,
    error,
    loading,
    streamingStatus,
}: QueryExecutionStatusProps) => {
    const {startTime, endTime} = useTypedSelector(selectQueryDuration);

    const durationMs = useElapsedDuration({startTime, endTime, loading});
    const formattedDuration = React.useMemo(() => {
        if (durationMs < 10 * SECOND_IN_MS) {
            return duration(durationMs).format('mm:ss.SSS');
        }
        return durationMs > HOUR_IN_SECONDS * SECOND_IN_MS
            ? duration(durationMs).format('hh:mm:ss')
            : duration(durationMs).format('mm:ss');
    }, [durationMs]);

    const status = getQueryExecutionStatus(error, loading);

    return (
        <QueryExecutionLabel
            status={status}
            streamingStatus={streamingStatus}
            className={className}
            value={formattedDuration}
            qa="ydb-query-execution-status"
        />
    );
};
