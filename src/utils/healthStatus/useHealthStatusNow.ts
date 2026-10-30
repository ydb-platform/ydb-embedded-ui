import React from 'react';

import {getHealthStatusNow} from './healthClock';

export function useHealthStatusNow(
    deadlines: readonly (number | undefined)[],
    enabled = true,
): number {
    const [now, setNow] = React.useState(getHealthStatusNow);
    const nextDeadline = deadlines.reduce<number>(
        (next, deadline) =>
            deadline !== undefined && Number.isFinite(deadline) && deadline > now
                ? Math.min(next, deadline)
                : next,
        Infinity,
    );
    React.useEffect(() => {
        if (!enabled || !Number.isFinite(nextDeadline)) {
            return undefined;
        }
        let timer: number;
        const update = () => {
            window.clearTimeout(timer);
            const current = getHealthStatusNow();
            if (current >= nextDeadline) {
                setNow(current);
            } else {
                // A fractional deadline can put this callback just before expiration.
                timer = window.setTimeout(update, nextDeadline - current);
            }
        };
        timer = window.setTimeout(update, Math.max(0, nextDeadline - getHealthStatusNow()));
        document.addEventListener('visibilitychange', update);
        window.addEventListener('pageshow', update);
        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', update);
            window.removeEventListener('pageshow', update);
        };
    }, [enabled, nextDeadline]);
    return now;
}
