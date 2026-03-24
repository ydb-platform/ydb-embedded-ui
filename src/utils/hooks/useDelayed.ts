import React from 'react';

export function useDelayed(delay = 600, enabled = true) {
    const [show, setShow] = React.useState(false);
    const [key, setKey] = React.useState(0);

    React.useEffect(() => {
        if (!enabled) {
            setShow(false);
            return undefined;
        }

        setShow(false);

        const timerId = window.setTimeout(() => {
            setShow(true);
        }, delay);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [delay, enabled, key]);

    const resetDelay = React.useCallback(() => {
        setKey((prevKey) => prevKey + 1);
    }, []);

    return [show, resetDelay] as const;
}
