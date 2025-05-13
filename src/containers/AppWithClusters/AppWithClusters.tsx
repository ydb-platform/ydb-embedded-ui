import React from 'react';

import type {Store} from '@reduxjs/toolkit';
import type {History} from 'history';

import {uiFactory} from '../../uiFactory/uiFactory';
import {App, AppSlots} from '../App';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {ExtendedCluster} from './ExtendedCluster/ExtendedCluster';
import {ExtendedTenant} from './ExtendedTenant/ExtendedTenant';

export interface AppWithClustersProps {
    store: Store;
    history: History;
    userSettings?: YDBEmbeddedUISettings;
    children?: React.ReactNode;
}

export function AppWithClusters({store, history, userSettings, children}: AppWithClustersProps) {
    return (
        <App store={store} history={history} userSettings={userSettings}>
            <AppSlots.ClusterSlot>
                {({component}) => {
                    return (
                        <ExtendedCluster
                            component={component}
                            getLogsLink={uiFactory.getLogsLink}
                            getMonitoringLink={uiFactory.getMonitoringLink}
                            getMonitoringClusterLink={uiFactory.getMonitoringClusterLink}
                        />
                    );
                }}
            </AppSlots.ClusterSlot>
            <AppSlots.TenantSlot>
                {({component}) => {
                    return (
                        <ExtendedTenant
                            component={component}
                            getLogsLink={uiFactory.getLogsLink}
                            getMonitoringLink={uiFactory.getMonitoringLink}
                        />
                    );
                }}
            </AppSlots.TenantSlot>
            {children}
        </App>
    );
}
