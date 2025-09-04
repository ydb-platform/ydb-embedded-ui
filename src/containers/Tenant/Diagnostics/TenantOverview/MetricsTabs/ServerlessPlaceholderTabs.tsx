import React from 'react';

import {cn} from '../../../../../utils/cn';
import {NON_BREAKING_SPACE} from '../../../../../utils/constants';
import {formatCoresLegend} from '../../../../../utils/metrics/formatMetricLegend';
import {TabCard} from '../TabCard/TabCard';

import './ServerlessPlaceholderTabs.scss';

const b = cn('tenant-metrics-tabs');

const PLACEHOLDER_VALUE = 0;
const PLACEHOLDER_LIMIT = 1;

interface ServerlessPlaceholderTabsProps {
    count?: number;
}

export const ServerlessPlaceholderTabs: React.FC<ServerlessPlaceholderTabsProps> = React.memo(
    ({count = 2}) => {
        const items = React.useMemo(() => Array.from({length: count}, (_, i) => i), [count]);

        return (
            <>
                {items.map((idx) => (
                    <div key={idx} className={b('link-container', {placeholder: true})}>
                        <div className={b('link')}>
                            <TabCard
                                text={NON_BREAKING_SPACE}
                                value={PLACEHOLDER_VALUE}
                                limit={PLACEHOLDER_LIMIT}
                                legendFormatter={formatCoresLegend}
                                active={false}
                                variant="serverless"
                                subtitle={NON_BREAKING_SPACE}
                            />
                        </div>
                    </div>
                ))}
            </>
        );
    },
);
