import {
    getHealthcheckViewsOrder,
    getHealthckechViewTitles,
    isIssueOfType,
    issueTypes,
} from '../containers/Tenant/Healthcheck/shared';
import type {IssuesTree} from '../store/reducers/healthcheckInfo/types';
import {
    getMonitoringClusterLink as getMonitoringClusterLinkDefault,
    getMonitoringLink as getMonitoringLinkDefault,
} from '../utils/monitoring';

import type {UIFactory} from './types';

const uiFactoryBase: UIFactory = {
    getMonitoringLink: getMonitoringLinkDefault,
    getMonitoringClusterLink: getMonitoringClusterLinkDefault,
    healthcheck: {
        issueTypes,
        isIssueOfType,
        getHealthckechViewTitles,
        getHealthcheckViewsOrder,
        countHealthcheckIssuesByType,
    },
    hasAccess: true,
    useDatabaseId: false,
    settingsBackend: undefined,
    enableMultiTabQueryEditor: false,
    hasDeveloperUi: true,
};

type UIFactoryOverrides<H extends string, T extends string> = Omit<
    Partial<UIFactory<H, T>>,
    'healthcheck'
> & {
    healthcheck?: Partial<UIFactory<H, T>['healthcheck']>;
};

export function configureUIFactory<H extends string, T extends string = string>(
    overrides: UIFactoryOverrides<H, T>,
) {
    const {healthcheck, ...restOverrides} = overrides;

    Object.assign(uiFactoryBase, restOverrides);
    if (healthcheck) {
        Object.assign(uiFactoryBase.healthcheck, healthcheck);
    }
}

export const uiFactory = new Proxy(uiFactoryBase, {
    set: () => {
        throw new Error('Use configureUIFactory(...) method instead of direct modifications');
    },
});

function countHealthcheckIssuesByType<H extends string>(
    issueTrees: IssuesTree[],
): Record<H | 'unknown', number> {
    const result: Record<string, number> = {
        unknown: 0,
    };

    const types = uiFactory.healthcheck.issueTypes;
    for (const knownType of types) {
        result[knownType] = 0;
    }

    for (const issue of issueTrees) {
        let found = false;
        for (const knownType of types) {
            if (uiFactory.healthcheck.isIssueOfType(issue, knownType)) {
                result[knownType]++;
                found = true;
                break;
            }
        }
        if (!found) {
            result.unknown++;
        }
    }
    return result;
}
