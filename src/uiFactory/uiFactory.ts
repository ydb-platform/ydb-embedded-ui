import isEqual from 'lodash/isEqual';

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
    hasAccess: () => true,
    useDatabaseId: false,
    settingsBackend: undefined,
    docs: undefined,
    enableMultiTabQueryEditor: false,
    hasDeveloperUi: true,
    isDetailedStorageViewAvailable: () => true,
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
    const {healthcheck, hasAccess, ...restOverrides} = overrides;

    Object.assign(uiFactoryBase, restOverrides);

    // Only override hasAccess when an actual function is provided.
    // Forwarding an optional config field could pass `undefined` here,
    // which would overwrite the default and crash on the next hasAccess(...) call.
    if (typeof hasAccess === 'function') {
        uiFactoryBase.hasAccess = hasAccess;
    }
    if (healthcheck) {
        const merged = {...uiFactoryBase.healthcheck, ...healthcheck};

        if (merged.issueCategories.some((c) => c.toLowerCase() === 'unknown')) {
            throw new Error(
                'Healthcheck misconfiguration: issueCategories contains the `unknown` category. This category is reserved and calculated automatically.',
            );
        }

        if (
            !isEqual(
                merged.issueCategories.toSorted(),
                merged.getHealthcheckViewsOrder().toSorted(),
            )
        ) {
            throw new Error(
                'Healthcheck misconfiguration: the `viewsOrder` should contain the same category as the `issueCategories`.',
            );
        }

        Object.assign(uiFactoryBase.healthcheck, healthcheck);
    }
}

export const uiFactory = new Proxy(uiFactoryBase, {
    set: () => {
        throw new Error('Use configureUIFactory(...) method instead of direct modifications');
    },
});
