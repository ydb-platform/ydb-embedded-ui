import React from 'react';

/**
 * The hook returns a stable function (an empty list of dependencies),
 * but this function always calls the actual function associated with the last render.
 * The returned function should be used as an event handler or inside a useEffect.
 */
export function useEventHandler<T extends Function>(handler?: T) {
    const ref = React.useRef<T | undefined>(handler);
    React.useLayoutEffect(() => {
        ref.current = handler;
    }, [handler]);
    // @ts-expect-error
    return React.useCallback<T>((...args) => {
        return ref.current?.(...args);
    }, []);
}
