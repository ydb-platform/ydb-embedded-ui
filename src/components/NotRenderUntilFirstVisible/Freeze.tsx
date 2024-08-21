//Code was copied from https://github.com/software-mansion/react-freeze/tree/main
import React from 'react';

interface FreezeProps {
    freeze: boolean;
    children: React.ReactNode;
    placeholder?: React.ReactNode;
}
export function Freeze({freeze, children, placeholder = null}: FreezeProps) {
    return (
        <React.Suspense fallback={placeholder}>
            <Suspender freeze={freeze}>{children}</Suspender>
        </React.Suspense>
    );
}

interface StorageRef {
    promise?: Promise<void>;
    resolve?: (value: void | PromiseLike<void>) => void;
}

interface SuspenderProps {
    freeze: boolean;
    children: React.ReactNode;
}
function Suspender({freeze, children}: SuspenderProps) {
    const promiseCache = React.useRef<StorageRef>({});
    if (freeze && !promiseCache.current.promise) {
        promiseCache.current.promise = new Promise((resolve) => {
            promiseCache.current.resolve = resolve;
        });
        throw promiseCache.current.promise;
    }
    if (freeze) {
        throw promiseCache.current.promise;
    }
    if (promiseCache.current.promise) {
        promiseCache.current.resolve?.();
        promiseCache.current.promise = undefined;
    }

    return <React.Fragment>{children}</React.Fragment>;
}
