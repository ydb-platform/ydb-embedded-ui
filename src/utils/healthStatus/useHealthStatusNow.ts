import React from 'react';

export function useHealthStatusNow(enabled = true): number {
    const [now, setNow] = React.useState(Date.now);
    React.useEffect(() => {
        if (!enabled) {
            return undefined;
        }
        const update = () => setNow(Date.now());
        update();
        const timer = window.setInterval(update, 1000);
        document.addEventListener('visibilitychange', update);
        window.addEventListener('pageshow', update);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', update);
            window.removeEventListener('pageshow', update);
        };
    }, [enabled]);
    return enabled ? Date.now() : now;
}
