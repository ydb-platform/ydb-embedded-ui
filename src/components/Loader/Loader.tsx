import React from 'react';

import type {LoaderSize} from '@gravity-ui/uikit';
import {Loader as KitLoader} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './Loader.scss';

const b = cn('ydb-loader');

interface LoaderProps {
    size?: LoaderSize;
    delay?: number;
    className?: string;
}

export const Loader = ({size = 'm', delay = 600, className}: LoaderProps) => {
    const show = useDelay(delay);
    if (!show) {
        return null;
    }
    return (
        <div className={b(null, className)}>
            <KitLoader size={size} />
        </div>
    );
};

function useDelay(delay = 600) {
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
