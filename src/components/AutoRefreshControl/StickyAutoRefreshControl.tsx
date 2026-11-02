import {cn} from '../../utils/cn';

import {AutoRefreshControl} from './AutoRefreshControl';

import './StickyAutoRefreshControl.scss';

const b = cn('ydb-sticky-auto-refresh-control');

export function StickyAutoRefreshControl() {
    return (
        <div className={b()}>
            <AutoRefreshControl className={b('control')} />
        </div>
    );
}
