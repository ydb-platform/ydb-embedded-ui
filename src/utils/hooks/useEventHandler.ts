import React from 'react';

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
