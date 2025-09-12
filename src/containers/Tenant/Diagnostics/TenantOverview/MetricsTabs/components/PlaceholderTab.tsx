import {cn} from '../../../../../../utils/cn';
import {NON_BREAKING_SPACE} from '../../../../../../utils/constants';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

export function PlaceholderTab() {
    return (
        <div className={b('link-container', {placeholder: true})}>
            <div className={b('link')}>
                <ServerlessTabCard
                    text={NON_BREAKING_SPACE}
                    active={false}
                    helpText={undefined}
                    subtitle={NON_BREAKING_SPACE}
                />
            </div>
        </div>
    );
}
