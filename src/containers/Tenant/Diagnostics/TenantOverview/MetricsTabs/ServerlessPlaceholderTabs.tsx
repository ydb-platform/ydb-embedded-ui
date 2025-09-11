import React from 'react';

import {cn} from '../../../../../utils/cn';
import {NON_BREAKING_SPACE} from '../../../../../utils/constants';
import {TabCard} from '../TabCard/TabCard';

import './MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface ServerlessPlaceholderTabsProps {
    count?: number;
}

export const ServerlessPlaceholderTabs: React.FC<ServerlessPlaceholderTabsProps> = React.memo(
    ({count = 2}) => {
        const items = React.useMemo(() => Array.from({length: count}, (_, i) => i), [count]);

        return items.map((idx) => (
            <div key={idx} className={b('link-container', {placeholder: true})}>
                <div className={b('link')}>
                    <TabCard
                        text={NON_BREAKING_SPACE}
                        active={false}
                        databaseType="Serverless"
                        subtitle={NON_BREAKING_SPACE}
                    />
                </div>
            </div>
        ));
    },
);
