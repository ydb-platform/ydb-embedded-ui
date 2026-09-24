import {isQueryCancelledError, isQueryErrorResponse} from './query';
import {isNetworkError, isResponseError} from './response';
import {reachMetricaGoal} from './yaMetrica';

type ObjectType = 'row_table' | 'column_table' | 'topic';
type CreationGoal = 'createObject' | 'createObjectSuccess' | 'createObjectError';

export function getObjectCreationErrorParams(error: unknown): Record<string, string | number> {
    if (isQueryCancelledError(error)) {
        return {errorType: 'cancelled'};
    }
    if (isResponseError(error)) {
        if (typeof error.status === 'number' && error.status > 0) {
            return {errorType: 'http', httpStatus: error.status};
        }
    }
    if (isQueryErrorResponse(error)) {
        return {errorType: 'ydb'};
    }
    if (isNetworkError(error)) {
        return {errorType: 'network'};
    }
    if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
    ) {
        return {errorType: 'timeout'};
    }
    return {errorType: 'unknown'};
}

export function reachObjectCreationGoal(
    goal: CreationGoal,
    objectType: ObjectType,
    error?: unknown,
) {
    try {
        reachMetricaGoal(goal, {
            objectType,
            ...(goal === 'createObjectError' ? getObjectCreationErrorParams(error) : {}),
        });
    } catch {
        // Analytics failures must not affect the creation request or its result.
    }
}
