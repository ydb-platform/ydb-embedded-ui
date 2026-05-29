import {
    getHealthcheckViewsOrder,
    getHealthckechViewTitles,
    isIssueTypeOfCategory,
    issueCategories,
} from '../containers/Tenant/Healthcheck/shared';
import {
    getMonitoringClusterLink as getMonitoringClusterLinkDefault,
    getMonitoringLink as getMonitoringLinkDefault,
} from '../utils/monitoring';

import type {UIFactory} from './types';

const uiFactoryBase: UIFactory = {
    getMonitoringLink: getMonitoringLinkDefault,
    getMonitoringClusterLink: getMonitoringClusterLinkDefault,
    healthcheck: {
        issueCategories,
        isIssueTypeOfCategory,
        getHealthckechViewTitles,
        getHealthcheckViewsOrder,
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
