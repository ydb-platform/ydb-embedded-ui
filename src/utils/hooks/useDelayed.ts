import React from 'react';

export function useDelayed(delay = 600) {
    const [show, setShow] = React.useState(false);
    const [key, setKey] = React.useState(0);

    React.useEffect(() => {
        setShow(false);
        const timerId = setTimeout(() => {
            setShow(true);
        }, delay);

        return () => {
            clearTimeout(timerId);
        };
    }, [delay, key]);

    const resetDelay = React.useCallback(() => {
        setKey((prevKey) => prevKey + 1);
    }, []);

    return [show, resetDelay] as const;
}
