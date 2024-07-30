import React from 'react';

export function useDelayed(delay = 600) {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const timerId = setTimeout(() => {
            setShow(true);
        }, delay);
        return () => {
            clearTimeout(timerId);
        };
    }, []);

    return show;
}
