import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {cn} from '../../../utils/cn';

import i18n from './i18n';

export const b = cn('ydb-healthcheck');

export type CommonIssueType = 'compute' | 'storage';

const HealthcheckViewTitles = {
    get storage() {
        return i18n('label_storage');
    },
    get compute() {
        return i18n('label_compute');
    },
};

const DefaultSortOrder: CommonIssueType[] = ['storage', 'compute'];

export function getHealthckechViewTitles() {
    return HealthcheckViewTitles;
}

export function getHealthcheckViewsOrder() {
    return DefaultSortOrder;
}

export function countHealthcheckIssuesByType(
    issueTrees: IssuesTree[],
): Record<CommonIssueType, number> {
    const result: Record<CommonIssueType, number> = {
        storage: 0,
        compute: 0,
    };

    for (const issue of issueTrees) {
        const type = issue.firstParentType ?? issue.type;
        if (!type) {
            continue;
        }
        if (type.startsWith('STORAGE')) {
            result.storage++;
        } else if (type.startsWith('COMPUTE')) {
            result.compute++;
        }
    }
    return result;
}

export type GetHealthcheckViewTitles<T extends string> = () => Record<T, string>;

export type GetHealthcheckViewsOrder<T> = () => T[];
