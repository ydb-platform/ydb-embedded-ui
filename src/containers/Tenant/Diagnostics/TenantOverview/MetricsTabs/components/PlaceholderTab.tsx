import {cn} from '../../../../../../utils/cn';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

export function PlaceholderTab() {
    return (
        <div className={b('link-container', {placeholder: true})}>
            <div className={b('link')} />
        </div>
    );
}
