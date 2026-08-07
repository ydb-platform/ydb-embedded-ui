import React from 'react';

import {SegmentedRadioGroup, Text} from '@gravity-ui/uikit';

import {uiFactory} from '../../../../uiFactory/uiFactory';
import {useTenantQueryParams} from '../../useTenantQueryParams';
import {HealthcheckViewTitles, b} from '../shared';
import type {countHealthcheckIssuesByCategory} from '../utils';
import {resolveHealthcheckView} from '../utils';

interface HealthcheckViewProps {
    issuesCount: ReturnType<typeof countHealthcheckIssuesByCategory>;
    viewTitles?: ReturnType<typeof uiFactory.healthcheck.getHealthckechViewTitles>;
    sortOrder?: ReturnType<typeof uiFactory.healthcheck.getHealthcheckViewsOrder>;
}

export function HealthcheckView({
    issuesCount,
    viewTitles = uiFactory.healthcheck.getHealthckechViewTitles(),
    sortOrder = uiFactory.healthcheck.getHealthcheckViewsOrder(),
}: HealthcheckViewProps) {
    const {view, handleHealthcheckViewChange, handleIssuesFilterChange} = useTenantQueryParams();

    type SortOrder = (typeof sortOrder)[number];
    type ExtendedSortOrder = SortOrder | 'unknown';

    const normalizedSortOrder: ExtendedSortOrder[] = React.useMemo(
        () => (issuesCount.unknown > 0 ? [...sortOrder, 'unknown'] : sortOrder),
        [issuesCount, sortOrder],
    );

    const activeView = React.useMemo(
        () => resolveHealthcheckView(view, issuesCount, sortOrder),
        [view, issuesCount, sortOrder],
    );

    React.useEffect(() => {
        if (view === activeView) {
            return;
        }
        handleHealthcheckViewChange(activeView);
    }, [view, activeView, handleHealthcheckViewChange]);

    const renderCount = (category: ExtendedSortOrder) => {
        return <Text color="secondary">{issuesCount[category] ?? 0}</Text>;
    };

    const renderHealthcheckViewOption = (category: ExtendedSortOrder) => {
        return (
            <SegmentedRadioGroup.Option value={category} key={category}>
                {viewTitles[category as SortOrder] ?? HealthcheckViewTitles[category] ?? category}
                &nbsp;
                {renderCount(category)}
            </SegmentedRadioGroup.Option>
        );
    };

    return (
        <SegmentedRadioGroup
            value={activeView ?? normalizedSortOrder[0]}
            onUpdate={(newView) => {
                handleHealthcheckViewChange(newView);
                handleIssuesFilterChange('');
            }}
            className={b('control-wrapper')}
        >
            {normalizedSortOrder.map((type) => renderHealthcheckViewOption(type))}
        </SegmentedRadioGroup>
    );
}
