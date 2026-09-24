import {isQueryErrorResponse} from './query';
import {isNetworkError, isResponseError} from './response';
import {reachMetricaGoal} from './yaMetrica';

type ObjectType = 'row_table' | 'column_table' | 'topic';
type CreationGoal = 'createObject' | 'createObjectSuccess' | 'createObjectError';

function getErrorParams(error: unknown): Record<string, string | number> {
    if (isResponseError(error)) {
        if (error.isCancelled) {
            return {errorType: 'cancelled'};
        }
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
            ...(goal === 'createObjectError' ? getErrorParams(error) : {}),
        });
    } catch {
        // Analytics failures must not affect the creation request or its result.
    }
}
