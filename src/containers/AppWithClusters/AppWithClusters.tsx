import React from 'react';

import type {Store} from '@reduxjs/toolkit';
import type {History} from 'history';

import type {
    GetLogsLink,
    GetMonitoringClusterLink,
    GetMonitoringLink,
} from '../../utils/monitoring';
import {
    getMonitoringClusterLink as getMonitoringClusterLinkDefault,
    getMonitoringLink as getMonitoringLinkDefault,
} from '../../utils/monitoring';
import {App, AppSlots} from '../App';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {ExtendedCluster} from './ExtendedCluster/ExtendedCluster';
import {ExtendedTenant} from './ExtendedTenant/ExtendedTenant';

export interface AppWithClustersProps {
    store: Store;
    history: History;
    getLogsLink?: GetLogsLink;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;
    userSettings?: YDBEmbeddedUISettings;
    children?: React.ReactNode;
}

export function AppWithClusters({
    store,
    history,
    getLogsLink,
    getMonitoringLink = getMonitoringLinkDefault,
    getMonitoringClusterLink = getMonitoringClusterLinkDefault,
    userSettings,
    children,
}: AppWithClustersProps) {
    return (
        <App store={store} history={history} userSettings={userSettings}>
            <AppSlots.ClusterSlot>
                {({component}) => {
                    return (
                        <ExtendedCluster
                            component={component}
                            getLogsLink={getLogsLink}
                            getMonitoringLink={getMonitoringLink}
                            getMonitoringClusterLink={getMonitoringClusterLink}
                        />
                    );
                }}
            </AppSlots.ClusterSlot>
            <AppSlots.TenantSlot>
                {({component}) => {
                    return (
                        <ExtendedTenant
                            component={component}
                            getLogsLink={getLogsLink}
                            getMonitoringLink={getMonitoringLink}
                        />
                    );
                }}
            </AppSlots.TenantSlot>
            {children}
        </App>
    );
}
