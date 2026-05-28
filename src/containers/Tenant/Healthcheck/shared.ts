import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {
    isComputeRelatedType,
    isStorageRelatedType,
} from '../../../store/reducers/healthcheckInfo/utils';
import {cn} from '../../../utils/cn';

import i18n from './i18n';

export const b = cn('ydb-healthcheck');

export type CommonIssueType = 'compute' | 'storage';

export const HealthcheckViewTitles = {
    get storage() {
        return i18n('label_storage');
    },
    get compute() {
        return i18n('label_compute');
    },
    get unknown() {
        return i18n('label_unknown');
    },
};

const DefaultSortOrder: CommonIssueType[] = ['storage', 'compute'];

export const issueTypes = ['storage', 'compute'] satisfies CommonIssueType[];

export function isIssueOfType(issue: IssuesTree, type: string) {
    const issueType = issue.type;
    if (!issueType) {
        return false;
    }

    if (type === 'storage') {
        return isStorageRelatedType(issueType);
    }

    if (type === 'compute') {
        return isComputeRelatedType(issueType);
    }

    return issueType.toLowerCase().startsWith(type);
}

export function getHealthckechViewTitles() {
    return HealthcheckViewTitles;
}

export function getHealthcheckViewsOrder() {
    return DefaultSortOrder;
}

export type GetHealthcheckViewTitles<T extends string> = () => Record<T, string>;

export type GetHealthcheckViewsOrder<T> = () => T[];
