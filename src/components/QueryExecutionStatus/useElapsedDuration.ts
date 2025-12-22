import React from 'react';

import {SECOND_IN_MS} from '../../utils/constants';

const FAST_REFRESH_MS = 100;
const FAST_REFRESH_JITTER_MS = 20;
const TEN_SECONDS_IN_MS = 10 * SECOND_IN_MS;

interface UseElapsedDurationParams {
    startTime?: number;
    endTime?: number;
    loading?: boolean;
}

export function useElapsedDuration({
    startTime,
    endTime,
    loading,
}: UseElapsedDurationParams): number {
    const [durationMs, setDurationMs] = React.useState<number>(
        startTime ? (endTime || Date.now()) - startTime : 0,
    );

    const setDuration = React.useCallback(() => {
        if (startTime) {
            const actualEndTime = endTime || Date.now();
            setDurationMs(actualEndTime - startTime);
        }
    }, [endTime, startTime]);

    const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const cancelledRef = React.useRef<boolean>(false);

    const tick = React.useCallback(() => {
        if (cancelledRef.current) {
            return;
        }
        setDuration();

        if (!loading || !startTime) {
            return;
        }

        const actualEndTime = endTime || Date.now();
        const elapsedMs = actualEndTime - startTime;
        const jitter = Math.floor((Math.random() * 2 - 1) * FAST_REFRESH_JITTER_MS);
        const nextDelay = elapsedMs < TEN_SECONDS_IN_MS ? FAST_REFRESH_MS + jitter : SECOND_IN_MS;
        timerRef.current = setTimeout(tick, nextDelay);
    }, [setDuration, loading, startTime, endTime]);

    React.useEffect(() => {
        cancelledRef.current = false;
        tick();
        return () => {
            cancelledRef.current = true;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [tick]);

    return durationMs;
}
