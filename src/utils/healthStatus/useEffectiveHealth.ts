import React from 'react';

import type {EFlag} from '../../types/api/enums';

import type {PreparedHealthStatus} from './healthStatus';
import {getEffectiveHealth, getHealthStatusError} from './healthStatus';
import {useHealthStatusNow} from './useHealthStatusNow';

type HealthStatus = PreparedHealthStatus & {Overall?: EFlag; error?: string};

export function useEffectiveHealth<T extends HealthStatus>(
    data: T | undefined,
    queryError?: unknown,
) {
    const deadlines = React.useMemo(() => [data?.healthExpiresAt], [data?.healthExpiresAt]);
    const now = useHealthStatusNow(deadlines);
    return React.useMemo(
        () => (data ? getEffectiveHealth(data, now, queryError) : data),
        [data, now, queryError],
    );
}

// A list refresh error belongs above the table; valid observations keep their status.
export function useEffectiveHealthList<Row, Health extends HealthStatus>(
    rows: Row[] | undefined,
    getHealth: (row: Row) => Health | undefined,
    setHealth: (row: Row, health: Health) => Row,
) {
    const deadlines = React.useMemo(
        () => rows?.map((row) => getHealth(row)?.healthExpiresAt) ?? [],
        [rows, getHealth],
    );
    const now = useHealthStatusNow(deadlines);
    return React.useMemo(
        () =>
            rows?.map((row) => {
                const health = getHealth(row);
                if (!health) {
                    return row;
                }
                const effectiveHealth = getEffectiveHealth(health, now);
                return effectiveHealth === health ? row : setHealth(row, effectiveHealth);
            }),
        [rows, getHealth, setHealth, now],
    );
}

export function useHealthStatusError(
    data: (PreparedHealthStatus & {error?: string}) | undefined,
    queryError?: unknown,
    {enabled = true, now}: {enabled?: boolean; now?: number} = {},
) {
    const deadlines = React.useMemo(() => [data?.healthExpiresAt], [data?.healthExpiresAt]);
    const localNow = useHealthStatusNow(deadlines, enabled && now === undefined);
    const effectiveNow = now ?? localNow;
    return {
        now: effectiveNow,
        error: data ? getHealthStatusError(data, effectiveNow, queryError) : undefined,
    };
}
