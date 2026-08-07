import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {uiFactory} from '../../../uiFactory/uiFactory';

import type {CommonIssueCategory} from './shared';

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
