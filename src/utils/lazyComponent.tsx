import React from 'react';

import {Loader} from '@gravity-ui/uikit';

import {useComponent} from '../components/ComponentsProvider/ComponentsProvider';
import {ErrorBoundaryFallback} from '../components/ErrorBoundary/ErrorBoundary';

export function lazyComponent<TExports extends {[key: string]: any}, TKey extends keyof TExports>(
    moduleLoader: () => Promise<TExports>,
    exportName: TKey,
    loader?: React.ReactNode,
) {
    const Component = React.lazy(() =>
        moduleLoader()
            .then((module) => ({default: module[exportName] as React.ComponentType}))
            .catch((error) => ({default: () => <ErrorBoundaryFallback error={error} />})),
    );

    const LazyComponent = React.forwardRef<TExports[TKey], React.ComponentProps<TExports[TKey]>>(
        (props, ref) => {
            const ErrorBoundary = useComponent('ErrorBoundary');
            return (
                <ErrorBoundary>
                    <React.Suspense fallback={loader ?? <DefaultLoader />}>
                        <Component ref={ref} {...props} />
                    </React.Suspense>
                </ErrorBoundary>
            );
        },
    );

    LazyComponent.displayName = exportName as string;
    return LazyComponent;
}

function DefaultLoader() {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Loader size="l" />
        </div>
    );
}
