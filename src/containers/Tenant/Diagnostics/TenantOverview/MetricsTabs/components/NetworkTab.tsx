import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {UtilizationTabCard} from '../../TabCard/UtilizationTabCard';
import i18n from '../../i18n';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface NetworkTabProps {
    to: string;
    active: boolean;
    networkUtilization: number;
}

export function NetworkTab({to, active, networkUtilization}: NetworkTabProps) {
    const fillPercent = networkUtilization * 100;

    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                <UtilizationTabCard
                    title={i18n('title_network')}
                    fillPercent={fillPercent}
                    active={active}
                    description={i18n('context_network-tab-description')}
                />
            </Link>
        </div>
    );
}
