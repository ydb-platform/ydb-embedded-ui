import React from 'react';

/** Latest elapsed deadline, or -Infinity before any deadline has elapsed. */
export function useHealthStatusNow(
    deadlines: readonly (number | undefined)[],
    enabled = true,
): number {
    const getSnapshot = React.useCallback(() => {
        const now = Date.now();
        return deadlines.reduce<number>(
            (expiredUpTo, deadline) =>
                deadline !== undefined && Number.isFinite(deadline) && deadline <= now
                    ? Math.max(expiredUpTo, deadline)
                    : expiredUpTo,
            -Infinity,
        );
    }, [deadlines]);

    const subscribe = React.useCallback(
        (onChange: () => void) => {
            if (!enabled) {
                return () => undefined;
            }

            let timer: number | undefined;
            const update = () => {
                window.clearTimeout(timer);
                const now = Date.now();
                const nextDeadline = deadlines.reduce<number>(
                    (next, deadline) =>
                        deadline !== undefined && Number.isFinite(deadline) && deadline > now
                            ? Math.min(next, deadline)
                            : next,
                    Infinity,
                );
                if (Number.isFinite(nextDeadline)) {
                    // Round up so fractional deadlines cannot fire before expiration.
                    timer = window.setTimeout(update, Math.ceil(nextDeadline - now));
                }
                onChange();
            };
            document.addEventListener('visibilitychange', update);
            window.addEventListener('pageshow', update);
            update();
            return () => {
                window.clearTimeout(timer);
                document.removeEventListener('visibilitychange', update);
                window.removeEventListener('pageshow', update);
            };
        },
        [deadlines, enabled],
    );

    return React.useSyncExternalStore(subscribe, getSnapshot);
}
