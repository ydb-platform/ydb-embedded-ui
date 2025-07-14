import React from 'react';

import type {Store} from '@reduxjs/toolkit';
import type {History} from 'history';
import {Helmet} from 'react-helmet-async';
import {connect} from 'react-redux';

import {componentsRegistry} from '../../components/ComponentsProvider/componentsRegistry';
import type {RootState} from '../../store';
import ReduxTooltip from '../ReduxTooltip/ReduxTooltip';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import ContentWrapper, {Content} from './Content';
import {NavigationWrapper} from './NavigationWrapper';
import {Providers} from './Providers';

import './App.scss';

export interface AppProps {
    store: Store;
    history: History;
    singleClusterMode: boolean;
    userSettings?: YDBEmbeddedUISettings;
    children?: React.ReactNode;
}

function App({store, history, singleClusterMode, children, userSettings}: AppProps) {
    const ChatPanel = componentsRegistry.get('ChatPanel');

    return (
        <Providers store={store} history={history}>
            <Helmet defaultTitle="YDB Monitoring" titleTemplate="%s — YDB Monitoring" />
            <ContentWrapper>
                <NavigationWrapper
                    singleClusterMode={singleClusterMode}
                    userSettings={userSettings}
                >
                    <Content singleClusterMode={singleClusterMode}>{children}</Content>
                    <div id="fullscreen-root"></div>
                </NavigationWrapper>
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
