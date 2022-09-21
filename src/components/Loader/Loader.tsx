import cn from 'bem-cn-lite';
import {Loader as KitLoader, LoaderSize} from '@gravity-ui/uikit';

import './Loader.scss';

const b = cn('kv-loader');

function Loader({size = 'l'}: {size?: LoaderSize}) {
    return (
        <div className={b()}>
            <KitLoader size={size} />
        </div>
    );
}

export default Loader;
