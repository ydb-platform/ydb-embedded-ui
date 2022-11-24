import cn from 'bem-cn-lite';
import {Loader as KitLoader, LoaderSize} from '@gravity-ui/uikit';

import './Loader.scss';

const b = cn('ydb-loader');

interface LoaderProps {
    size?: LoaderSize;
}

export const Loader = ({size = 'm'}: LoaderProps) => {
    return (
        <div className={b()}>
            <KitLoader size={size} />
        </div>
    );
};
