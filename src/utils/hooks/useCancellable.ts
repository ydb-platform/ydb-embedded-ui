import React from 'react';

export function useCancellableFunction<T extends {cancel: () => void}>(cancellable: T) {
    React.useEffect(() => {
        return () => {
            cancellable.cancel();
        };
    }, [cancellable]);
    return cancellable;
}
