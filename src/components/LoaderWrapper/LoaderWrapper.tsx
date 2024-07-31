import React from 'react';

import type {LoaderSize} from '@gravity-ui/uikit';

import {Loader} from '../Loader/Loader';

interface LoaderWrapperProps {
    loading?: boolean;
    size?: LoaderSize;
    className?: string;
    children: React.ReactNode;
}

export function LoaderWrapper({loading, size = 'm', className, children}: LoaderWrapperProps) {
    if (loading) {
        return <Loader size={size} className={className} />;
    }
    return children;
}
