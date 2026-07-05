import React from 'react';

import {Divider, Text} from '@gravity-ui/uikit';

import {SegmentedProgress} from '../../../../../components/SegmentedProgress/SegmentedProgress';
import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

import './MetricPageSummary.scss';

const b = cn('ydb-tenant-metric-page-summary');

type MetricPageSummaryProgressTheme = 'success' | 'warning' | 'danger';

interface MetricPageSummaryProps {
    className?: string;
    dataQa: string;
    description: string;
    legend?: string;
    percentText: string;
    progressTheme?: MetricPageSummaryProgressTheme;
    progressValue: number;
}

export function MetricPageSummary({
    className,
    dataQa,
    description,
    legend,
    percentText,
    progressTheme,
    progressValue,
}: MetricPageSummaryProps) {
    const hasLegend = legend !== undefined;

    return (
        <div className={b(null, className)} data-qa={dataQa}>
            <div className={b('content')}>
                <div className={b('header')}>
                    <Text
                        className={b('description')}
                        color="secondary"
                        data-qa="tenant-page-metric-summary-description"
                    >
                        {description}
                    </Text>
                    <div className={b('values')}>
                        <Text color="secondary" data-qa="tenant-page-metric-summary-percent">
                            {i18n('context_metric-summary-used', {value: percentText})}
                        </Text>
                        {hasLegend && (
                            <React.Fragment>
                                <Divider className={b('divider')} orientation="vertical" />
                                <Text color="secondary" data-qa="tenant-page-metric-summary-value">
                                    {legend}
                                </Text>
                            </React.Fragment>
                        )}
                    </div>
                </div>
                <SegmentedProgress
                    className={b('progress')}
                    dataQa="tenant-page-metric-summary-progress"
                    value={progressValue}
                    total={100}
                    theme={progressTheme ?? 'neutral'}
                    hideLabels
                    ariaLabel={description}
                />
            </div>
        </div>
    );
}
