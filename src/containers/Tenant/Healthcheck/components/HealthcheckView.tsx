import React from 'react';

import {SegmentedRadioGroup, Text} from '@gravity-ui/uikit';

import {uiFactory} from '../../../../uiFactory/uiFactory';
import {useTenantQueryParams} from '../../useTenantQueryParams';
import {HealthcheckViewTitles, b} from '../shared';
import type {countHealthcheckIssuesByCategory} from '../utils';

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

    React.useEffect(() => {
        if (view && normalizedSortOrder.includes(view as ExtendedSortOrder)) {
            return;
        }
        const firstIssueTypeWithIssues = normalizedSortOrder.find(
            (issueType) => issuesCount[issueType] > 0,
        );
        handleHealthcheckViewChange(firstIssueTypeWithIssues);
    }, [view, handleHealthcheckViewChange, issuesCount, normalizedSortOrder]);

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
            value={view ?? normalizedSortOrder[0]}
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
