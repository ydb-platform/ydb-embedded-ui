import {
    countHealthcheckIssuesByType,
    getHealthcheckViewsOrder,
    getHealthckechViewTitles,
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
        getHealthckechViewTitles,
        getHealthcheckViewsOrder,
    },
    countHealthcheckIssuesByType: countHealthcheckIssuesByType,
};

export function configureUIFactory(overrides: UIFactory) {
    Object.assign(uiFactoryBase, overrides);
}

export const uiFactory = new Proxy(uiFactoryBase, {
    set: () => {
        throw new Error('Use configureUIFactory(...) method instead of direct modifications');
    },
});
