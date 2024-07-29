import React from 'react';

import type {LoaderSize} from '@gravity-ui/uikit';
import {Loader as KitLoader} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './Loader.scss';

const b = cn('ydb-loader');

interface LoaderProps {
    size?: LoaderSize;
    className?: string;
}

export const Loader = ({size = 'm', className}: LoaderProps) => {
    return (
        <div className={b(null, className)}>
            <KitLoader size={size} />
        </div>
    );
};

interface LoaderWrapperProps {
    isLoading?: boolean;
    children?: React.ReactNode;
    size?: LoaderSize;
    loaderClassName?: string;
}
export function LoaderWrapper({
    isLoading,
    children,
    size = 'm',
    loaderClassName,
}: LoaderWrapperProps) {
    if (isLoading) {
        return <Loader size={size} className={loaderClassName} />;
    }

    return <React.Fragment>{children}</React.Fragment>;
}
