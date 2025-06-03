import React from 'react';

import {CircleDollar, Clock} from '@gravity-ui/icons';
import {Icon, Progress, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import type {QuotaInfo} from '../../types/chat';

import './QuotaDisplay.scss';

const b = cn('ydb-quota-display');

interface QuotaDisplayProps {
    className?: string;
    refreshTrigger?: number; // Increment this to trigger refresh
    compact?: boolean; // Compact mode for header display
}

export const QuotaDisplay = ({className, refreshTrigger, compact = false}: QuotaDisplayProps) => {
    const [quota, setQuota] = React.useState<QuotaInfo | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const fetchQuota = React.useCallback(async () => {
        try {
            setLoading(true);
            const quotaData = await window.api.aiAssist?.getQuota();
            setQuota(quotaData || null);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load quota');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchQuota();
    }, [fetchQuota, refreshTrigger]);

    const formatCost = (cost: number) => {
        if (cost === Infinity) {
            return '∞';
        }
        if (cost < 0.001) {
            return '<$0.001';
        }
        return `$${cost.toFixed(2)}`;
    };

    const formatLimit = (limit: number) => {
        if (limit === Infinity) {
            return 'Unlimited';
        }
        return `$${limit}`;
    };

    if (loading) {
        return (
            <div className={b({compact}, className)}>
                <div className={b('header')}>
                    <Icon data={CircleDollar} size={12} />
                    <Text variant="caption-2" color="secondary">
                        Loading...
                    </Text>
                </div>
            </div>
        );
    }

    if (error || !quota) {
        return (
            <div className={b({compact}, className)}>
                <div className={b('header')}>
                    <Icon data={CircleDollar} size={12} />
                    <Text variant="caption-2" color="secondary">
                        {error || 'No quota'}
                    </Text>
                </div>
            </div>
        );
    }

    // Compact mode - single line display
    if (compact) {
        const highestUsage = Math.max(quota.daily.percentage, quota.monthly.percentage);
        const isHighUsage = highestUsage > 80;

        return (
            <div className={b({compact}, className)}>
                <div className={b('compact-content')}>
                    <Icon data={CircleDollar} size={12} />
                    <Text variant="caption-2" color={isHighUsage ? 'danger' : 'secondary'}>
                        {formatCost(quota.daily.used)}/{formatLimit(quota.daily.limit)} •{' '}
                        {formatCost(quota.monthly.used)}/{formatLimit(quota.monthly.limit)}
                    </Text>
                </div>
            </div>
        );
    }

    // Full mode - detailed display
    return (
        <div className={b(null, className)}>
            <div className={b('header')}>
                <Icon data={CircleDollar} size={12} />
                <Text variant="caption-2" color="secondary">
                    Quota ({quota.login})
                </Text>
            </div>

            <div className={b('periods')}>
                {/* Daily quota */}
                <div className={b('period')}>
                    <div className={b('period-header')}>
                        <Icon data={Clock} size={10} />
                        <Text variant="caption-2" color="secondary">
                            Daily
                        </Text>
                    </div>

                    <div className={b('period-info')}>
                        <Text variant="caption-2" color="secondary">
                            {formatCost(quota.daily.used)} / {formatLimit(quota.daily.limit)}
                        </Text>

                        {quota.daily.limit !== Infinity && (
                            <Progress
                                value={quota.daily.percentage}
                                size="xs"
                                theme={quota.daily.percentage > 80 ? 'danger' : undefined}
                                className={b('progress')}
                            />
                        )}
                    </div>
                </div>

                {/* Monthly quota */}
                <div className={b('period')}>
                    <div className={b('period-header')}>
                        <Icon data={Clock} size={10} />
                        <Text variant="caption-2" color="secondary">
                            Monthly
                        </Text>
                    </div>

                    <div className={b('period-info')}>
                        <Text variant="caption-2" color="secondary">
                            {formatCost(quota.monthly.used)} / {formatLimit(quota.monthly.limit)}
                        </Text>

                        {quota.monthly.limit !== Infinity && (
                            <Progress
                                value={quota.monthly.percentage}
                                size="xs"
                                theme={quota.monthly.percentage > 80 ? 'danger' : undefined}
                                className={b('progress')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
