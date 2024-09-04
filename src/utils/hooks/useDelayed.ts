import React from 'react';

export function useDelayed(initialDelay = 600) {
    const [show, setShow] = React.useState(false);
    const [delay, setDelay] = React.useState(initialDelay);
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

    const resetDelay = React.useCallback(
        (newDelay = initialDelay) => {
            setDelay(newDelay);
            setKey((prevKey) => prevKey + 1);
        },
        [initialDelay],
    );

    return [show, resetDelay] as const;
}
