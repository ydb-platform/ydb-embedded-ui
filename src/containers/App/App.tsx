import React from 'react';

import type {Store} from '@reduxjs/toolkit';
import type {History} from 'history';
import {Helmet} from 'react-helmet-async';
import {connect} from 'react-redux';

import {componentsRegistry} from '../../components/ComponentsProvider/componentsRegistry';
import {ErrorBoundary} from '../../components/ErrorBoundary/ErrorBoundary';
import type {RootState} from '../../store';
import {Navigation} from '../AsideNavigation/Navigation';
import ReduxTooltip from '../ReduxTooltip/ReduxTooltip';
import {getUserSettings} from '../UserSettings/settings';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import ContentWrapper, {Content} from './Content';
import {Providers} from './Providers';

import './App.scss';

export interface AppProps {
    store: Store;
    history: History;
    singleClusterMode: boolean;
    userSettings?: YDBEmbeddedUISettings;
    children?: React.ReactNode;
}

function App({
    store,
    history,
    singleClusterMode,
    children,
    userSettings = getUserSettings({singleClusterMode}),
}: AppProps) {
    const ChatPanel = componentsRegistry.get('ChatPanel');

    return (
        <Providers store={store} history={history}>
            <Helmet defaultTitle="YDB Monitoring" titleTemplate="%s — YDB Monitoring" />
            <ContentWrapper>
                <Navigation userSettings={userSettings}>
                    <ErrorBoundary>
                        <Content singleClusterMode={singleClusterMode}>{children}</Content>
                        <div id="fullscreen-root"></div>
                    </ErrorBoundary>
                </Navigation>
            </ContentWrapper>
            {ChatPanel && <ChatPanel />}
            <ReduxTooltip />
        </Providers>
    );
}

function mapStateToProps(state: RootState) {
    return {
        singleClusterMode: state.singleClusterMode,
    };
}

export default connect(mapStateToProps)(App);
