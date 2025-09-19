import {Link} from 'react-router-dom';

import {formatBytes} from '../../../../../../utils/bytesParsers/formatBytes';
import {cn} from '../../../../../../utils/cn';
import {UtilizationTabCard} from '../../TabCard/UtilizationTabCard';
import i18n from '../../i18n';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface NetworkTabProps {
    to: string;
    active: boolean;
    networkUtilization?: number;
    networkThroughput?: number;
}

export function NetworkTab({to, active, networkUtilization, networkThroughput}: NetworkTabProps) {
    const canShow =
        networkUtilization !== undefined &&
        networkThroughput !== undefined &&
        isFinite(networkUtilization) &&
        isFinite(networkThroughput);

    if (!canShow) {
        return null;
    }

    const fillPercent = networkUtilization * 100;
    const legendText = formatBytes({value: networkThroughput, withSpeedLabel: true});

    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                <UtilizationTabCard
                    text={i18n('context_network-usage')}
                    fillPercent={fillPercent}
                    legendText={legendText}
                    active={active}
                    helpText={i18n('context_network-description')}
                />
            </Link>
        </div>
    );
}
