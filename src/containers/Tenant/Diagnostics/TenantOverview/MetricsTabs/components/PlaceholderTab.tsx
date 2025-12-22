import {cn} from '../../../../../../utils/cn';
import {UNBREAKABLE_GAP} from '../../../../../../utils/constants';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

export function PlaceholderTab() {
    return (
        <div className={b('link-container', {placeholder: true})}>
            <div className={b('link')}>
                <ServerlessTabCard
                    text={UNBREAKABLE_GAP}
                    active={false}
                    helpText={undefined}
                    subtitle={UNBREAKABLE_GAP}
                />
            </div>
        </div>
    );
}
