import {
    isComputeRelatedType,
    isStorageRelatedType,
} from '../../../store/reducers/healthcheckInfo/utils';
import {cn} from '../../../utils/cn';

import i18n from './i18n';

export const b = cn('ydb-healthcheck');

export type CommonIssueCategory = 'compute' | 'storage';

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

const DefaultSortOrder: CommonIssueCategory[] = ['storage', 'compute'];

export const issueCategories = ['storage', 'compute'] satisfies CommonIssueCategory[];

export function isIssueTypeOfCategory(issueType: string, category: string) {
    if (!issueType) {
        return false;
    }

    if (category === 'storage') {
        return isStorageRelatedType(issueType);
    }

    if (category === 'compute') {
        return isComputeRelatedType(issueType);
    }

    return issueType.toLowerCase().startsWith(category);
}

export function getHealthckechViewTitles() {
    return HealthcheckViewTitles;
}

export function getHealthcheckViewsOrder() {
    return DefaultSortOrder;
}

export type GetHealthcheckViewTitles<T extends string> = () => Record<T, string>;

export type GetHealthcheckViewsOrder<T> = () => T[];
