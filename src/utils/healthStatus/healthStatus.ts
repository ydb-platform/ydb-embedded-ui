import {EFlag} from '../../types/api/enums';
import {extractErrorDetails, prepareCommonErrorMessage} from '../errors';
import {isEnumMember} from '../typecheckers';

import i18n from './i18n';

// Meta's health observation contract has a fixed two-minute maximum lifetime.
// Reject larger values rather than extending trust in a response from another version.
const MAX_HEALTH_TTL_MS = 120000;

export interface PreparedHealthStatus {
    /** Only Meta adapters opt in; Viewer and legacy cp_databases retain their behavior. */
    healthStatusSource?: 'meta';
    /** Fixed local deadline captured by the query adapter; cache reads never renew it. */
    healthExpiresAt?: number;
}

export function prepareHealthStatus<T extends {status_ttl_ms?: number}>(
    data: T,
    requestStartedAt: number,
): T & PreparedHealthStatus {
    const ttl = data.status_ttl_ms;
    return {
        ...data,
        healthStatusSource: 'meta',
        healthExpiresAt:
            typeof ttl === 'number' && Number.isInteger(ttl) && ttl >= 0 && ttl <= MAX_HEALTH_TTL_MS
                ? requestStartedAt + ttl
                : undefined,
    };
}

export function getHealthStatusError(
    data: (PreparedHealthStatus & {error?: string}) | undefined,
    now: number,
    queryError?: unknown,
): string | undefined {
    if (queryError !== undefined) {
        const details = extractErrorDetails(queryError);
        return (
            details?.title ||
            prepareCommonErrorMessage(queryError, i18n('description_refresh-failed'))
        );
    }
    if (data?.error) {
        return data.error;
    }
    if (data?.healthExpiresAt === undefined || !Number.isFinite(data.healthExpiresAt)) {
        return i18n('description_freshness-unavailable');
    }
    if (now >= data.healthExpiresAt) {
        return i18n('description_expired');
    }
    return undefined;
}

export function getEffectiveHealth<
    T extends PreparedHealthStatus & {Overall?: EFlag; error?: string},
>(data: T, now: number, queryError?: unknown): T {
    // Only the Meta health query adapters establish this contract. Viewer and
    // legacy cp_databases results retain their existing behavior.
    if (data.healthStatusSource !== 'meta') {
        return data;
    }
    const error =
        getHealthStatusError(data, now, queryError) ||
        (isEnumMember(EFlag, data.Overall) ? undefined : i18n('description_result-unavailable'));
    return error ? {...data, Overall: EFlag.Grey, error} : data;
}
