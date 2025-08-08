import React from 'react';

import {SegmentedRadioGroup, Text} from '@gravity-ui/uikit';

import {uiFactory} from '../../../../uiFactory/uiFactory';
import {useTenantQueryParams} from '../../useTenantQueryParams';
import type {CommonIssueType} from '../shared';
import {b} from '../shared';

const HealthcheckViewValues: Record<string, CommonIssueType> = {
    storage: 'storage',
    compute: 'compute',
};

interface HealthcheckViewProps {
    issuesCount: ReturnType<typeof uiFactory.healthcheck.countHealthcheckIssuesByType>;
    viewTitles?: ReturnType<typeof uiFactory.healthcheck.getHealthckechViewTitles>;
    sortOrder?: ReturnType<typeof uiFactory.healthcheck.getHealthcheckViewsOrder>;
}

export function HealthcheckView({
    issuesCount,
    viewTitles = uiFactory.healthcheck.getHealthckechViewTitles(),
    sortOrder = uiFactory.healthcheck.getHealthcheckViewsOrder(),
}: HealthcheckViewProps) {
    const {view, handleHealthcheckViewChange, handleIssuesFilterChange} = useTenantQueryParams();

    const issuesTypes = React.useMemo(() => Object.keys(issuesCount), [issuesCount]);

    React.useEffect(() => {
        if (view) {
            return;
        }
        if (issuesCount[HealthcheckViewValues.storage]) {
            handleHealthcheckViewChange(HealthcheckViewValues.storage);
        } else if (issuesCount[HealthcheckViewValues.compute]) {
            handleHealthcheckViewChange(HealthcheckViewValues.compute);
        } else {
            const firstIssueTypeWithIssues = sortOrder.find(
                (issueType) => issuesCount[issueType] > 0,
            );
            handleHealthcheckViewChange(firstIssueTypeWithIssues);
        }
    }, [view, handleHealthcheckViewChange, issuesCount, issuesTypes, sortOrder]);

    const renderCount = (view: (typeof sortOrder)[number]) => {
        return <Text color="secondary">{issuesCount[view] ?? 0}</Text>;
    };

    const renderHealthcheckViewOption = (view: (typeof sortOrder)[number]) => {
        return (
            <SegmentedRadioGroup.Option value={view} key={view}>
                {viewTitles[view] ?? view}&nbsp;
                {renderCount(view)}
            </SegmentedRadioGroup.Option>
        );
    };

    return (
        <SegmentedRadioGroup
            value={view}
            onUpdate={(newView) => {
                handleHealthcheckViewChange(newView);
                handleIssuesFilterChange('');
            }}
            className={b('control-wrapper')}
        >
            {sortOrder.map((type) => renderHealthcheckViewOption(type))}
        </SegmentedRadioGroup>
    );
}
