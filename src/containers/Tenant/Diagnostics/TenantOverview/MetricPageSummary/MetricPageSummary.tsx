import React from 'react';

import {Divider, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';
import type {MetricPageSummaryPresentation} from '../metricPresentation';

import './MetricPageSummary.scss';

const b = cn('ydb-tenant-metric-page-summary');

export interface MetricPageSummaryData {
    description: string;
    presentation: MetricPageSummaryPresentation;
}

interface MetricPageSummaryProps extends MetricPageSummaryData {
    dataQa: string;
    className?: string;
}

export function MetricPageSummary({
    className,
    dataQa,
    description,
    presentation,
}: MetricPageSummaryProps) {
    const {percentText, progressTheme, progressValue, valueText} = presentation;
    const hasValueText = valueText !== undefined;

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
                        {hasValueText && (
                            <React.Fragment>
                                <Divider className={b('divider')} orientation="vertical" />
                                <Text color="secondary" data-qa="tenant-page-metric-summary-value">
                                    {valueText}
                                </Text>
                            </React.Fragment>
                        )}
                    </div>
                </div>
                <div
                    className={b('progress', {
                        theme: progressTheme,
                        full: progressValue >= 100,
                    })}
                    data-qa="tenant-page-metric-summary-progress"
                    style={
                        {
                            '--metric-page-summary-progress-fill': `${progressValue}%`,
                        } as React.CSSProperties
                    }
                >
                    <div className={b('progress-fill')} />
                    <div className={b('progress-rest')} />
                </div>
            </div>
        </div>
    );
}
