import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {uiFactory} from '../../../uiFactory/uiFactory';

import type {CommonIssueCategory} from './shared';
import type {HealthcheckAssistantSnapshot, HealthcheckAssistantTarget} from './types';

export function getDatabaseHealthcheckAssistantTarget({
    database,
    clusterName,
    scope,
}: {
    database: string;
    clusterName?: string;
    scope: 'cluster' | 'database';
}): HealthcheckAssistantTarget {
    const request = clusterName === undefined ? {database} : {database, clusterName};

    return scope === 'database' ? {scope: 'database', request} : {scope: 'cluster', request};
}

export function getHealthcheckAssistantContext({
    hasAction,
    successful,
    target,
    snapshot,
}: {
    hasAction: boolean;
    successful: boolean;
    target: HealthcheckAssistantTarget;
    snapshot: HealthcheckAssistantSnapshot;
}): {target: HealthcheckAssistantTarget; snapshot: HealthcheckAssistantSnapshot} | undefined {
    return hasAction && successful ? {target, snapshot} : undefined;
}

export function countHealthcheckIssuesByCategory<H extends string = CommonIssueCategory>(
    issueTrees: IssuesTree[],
): Record<H | 'unknown', number> {
    const result: Record<string, number> = {
        unknown: 0,
    };

    const categories: readonly string[] = uiFactory.healthcheck.issueCategories;
    for (const category of categories) {
        result[category] = 0;
    }

    for (const issue of issueTrees) {
        result[issue.categoryForUI] = (result[issue.categoryForUI] ?? 0) + 1;
    }

    return result;
}

export function resolveHealthcheckView<H extends string>(
    currentView: string | null | undefined,
    issuesCount: Record<H | 'unknown', number>,
    sortOrder: readonly H[],
): H | 'unknown' | undefined {
    const availableViews: readonly (H | 'unknown')[] =
        issuesCount.unknown > 0 ? [...sortOrder, 'unknown'] : sortOrder;

    return (
        availableViews.find((view) => view === currentView) ??
        availableViews.find((view) => issuesCount[view] > 0)
    );
}
