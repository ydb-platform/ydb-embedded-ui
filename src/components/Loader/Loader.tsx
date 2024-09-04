import type {LoaderSize} from '@gravity-ui/uikit';
import {Loader as KitLoader} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {useDelayed} from '../../utils/hooks/useDelayed';

import './Loader.scss';

const b = cn('ydb-loader');

interface LoaderProps {
    size?: LoaderSize;
    delay?: number;
    className?: string;
}

export const Loader = ({size = 'm', delay = 600, className}: LoaderProps) => {
    const [show] = useDelayed(delay);
    if (!show) {
        return null;
    }
    return (
        <div className={b(null, className)}>
            <KitLoader size={size} />
        </div>
    );
};
