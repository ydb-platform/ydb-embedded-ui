import cn from 'bem-cn-lite';
import {Loader as KitLoader, LoaderSize} from '@gravity-ui/uikit';

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
