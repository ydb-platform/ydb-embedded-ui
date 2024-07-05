import React from 'react';

import type {Store} from '@reduxjs/toolkit';
import type {History} from 'history';

import type {GetMonitoringClusterLink, GetMonitoringLink} from '../../utils/monitoring';
import {
    getMonitoringClusterLink as getMonitoringClusterLinkDefault,
    getMonitoringLink as getMonitoringLinkDefault,
} from '../../utils/monitoring';
import {App, AppSlots} from '../App';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {ExtendedCluster} from './ExtendedCluster/ExtendedCluster';
import {ExtendedNode} from './ExtendedNode/ExtendedNode';
import {ExtendedTenant} from './ExtendedTenant/ExtendedTenant';

export interface AppWithClustersProps {
    store: Store;
    history: History;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;
    userSettings?: YDBEmbeddedUISettings;
    children?: React.ReactNode;
}

export function AppWithClusters({
    store,
    history,
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
