import {App, AppSlots} from '../App';

import type {History} from 'history';
import type {Store} from '@reduxjs/toolkit';

import type {GetMonitoringClusterLink, GetMonitoringLink} from '../../utils/monitoring';

import {
    getMonitoringLink as getMonitoringLinkDefault,
    getMonitoringClusterLink as getMonitoringClusterLinkDefault,
} from '../../utils/monitoring';
import {ExtendedCluster} from './ExtendedCluster/ExtendedCluster';
import {ExtendedNode} from './ExtendedNode/ExtendedNode';
import {ExtendedTenant} from './ExtendedTenant/ExtendedTenant';
import {YDBEmbeddedUISettings, settings} from '../UserSettings/settings';
import {USE_CLUSTER_BALANCER_AS_BACKEND_KEY} from '../../utils/constants';

import i18n from './i18n';
import React from 'react';

export interface AppWithClustersProps {
    store: Store;
    history: History;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;
    userSettings?: YDBEmbeddedUISettings;
    children?: React.ReactNode;
}

const defaultUserSettings = settings;

defaultUserSettings[1].sections[0].settings.push({
    title: i18n('settings.useClusterBalancerAsBackend.title'),
    helpPopoverContent: i18n('settings.useClusterBalancerAsBackend.popover'),
    settingKey: USE_CLUSTER_BALANCER_AS_BACKEND_KEY,
});

export function AppWithClusters({
    store,
    history,
    getMonitoringLink = getMonitoringLinkDefault,
    getMonitoringClusterLink = getMonitoringClusterLinkDefault,
    userSettings = defaultUserSettings,
    children,
}: AppWithClustersProps) {
    return (
        <App store={store} history={history} userSettings={userSettings}>
            <AppSlots.ClusterSlot>
                {({component}) => {
                    return (
                        <ExtendedCluster
                            component={component}
                            getMonitoringLink={getMonitoringLink}
                            getMonitoringClusterLink={getMonitoringClusterLink}
                        />
                    );
                }}
            </AppSlots.ClusterSlot>
            <AppSlots.NodeSlot>
                {({component}) => {
                    return <ExtendedNode component={component} />;
                }}
            </AppSlots.NodeSlot>
            <AppSlots.TenantSlot>
                {({component}) => {
                    return (
                        <ExtendedTenant
                            component={component}
                            getMonitoringLink={getMonitoringLink}
                        />
                    );
                }}
            </AppSlots.TenantSlot>
            {children}
        </App>
    );
}
