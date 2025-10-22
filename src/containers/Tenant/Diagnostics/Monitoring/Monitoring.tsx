import {cn} from '../../../../utils/cn';

import './Monitoring.scss';

const b = cn('ydb-monitoring');

interface MonitoringProps {
    database: string;
    monitoringUrl?: string;
}

export function Monitoring({monitoringUrl}: MonitoringProps) {
    if (!monitoringUrl) {
        return (
            <div className={b('empty')}>
                <div className={b('empty-text')}>Monitoring is not available</div>
            </div>
        );
    }

    return (
        <div className={b()}>
            <iframe
                className={b('iframe')}
                src={monitoringUrl}
                title="YDB Monitoring Dashboard"
                frameBorder="0"
            />
        </div>
    );
}
