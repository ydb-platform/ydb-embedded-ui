import React from 'react';

import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';

import './Monitoring.scss';

const b = cn('ydb-monitoring');

interface MonitoringProps {
    database: string;
    monitoringUrl?: string;
}

const MONITORING_TABS = [
    {value: 'diagnostics', content: 'Diagnostics'},
    {value: 'transactions', content: 'Transactions'},
    {value: 'calling-api', content: 'Calling API'},
    {value: 'yql-queries', content: 'YQL Queries'},
    {value: 'tables-rw', content: 'Tables R/W'},
    {value: 'topics-rw', content: 'Topics R/W'},
];

export function Monitoring({monitoringUrl}: MonitoringProps) {
    const [activeTab, setActiveTab] = React.useState('diagnostics');

    if (!monitoringUrl) {
        return (
            <div className={b('empty')}>
                <div className={b('empty-text')}>Monitoring is not available</div>
            </div>
        );
    }

    return (
        <div className={b()}>
            <div className={b('controls')}>
                <SegmentedRadioGroup
                    size="l"
                    value={activeTab}
                    onUpdate={setActiveTab}
                    options={MONITORING_TABS}
                />
            </div>
            <div className={b('content')}>
                <iframe
                    className={b('iframe')}
                    src={monitoringUrl}
                    title="YDB Monitoring Dashboard"
                    frameBorder="0"
                />
            </div>
        </div>
    );
}
