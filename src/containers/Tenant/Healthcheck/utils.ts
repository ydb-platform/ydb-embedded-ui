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
