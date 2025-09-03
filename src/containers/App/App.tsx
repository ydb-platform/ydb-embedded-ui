import React from 'react';

import type {Store} from '@reduxjs/toolkit';
import type {History} from 'history';
import {Helmet} from 'react-helmet-async';

import {componentsRegistry} from '../../components/ComponentsProvider/componentsRegistry';
import {FullscreenProvider} from '../../components/Fullscreen/FullscreenContext';
import {useTypedSelector} from '../../utils/hooks';
import ReduxTooltip from '../ReduxTooltip/ReduxTooltip';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

import {useAppTitle} from './AppTitleContext';
import ContentWrapper, {Content} from './Content';
import {NavigationWrapper} from './NavigationWrapper';
import {Providers} from './Providers';

import './App.scss';

const defaultAppTitle = 'YDB Monitoring';

export interface AppProps {
    store: Store;
    history: History;
    userSettings?: YDBEmbeddedUISettings;
    children?: React.ReactNode;
    appTitle?: string;
}

function App({store, history, children, userSettings, appTitle = defaultAppTitle}: AppProps) {
    const ChatPanel = componentsRegistry.get('ChatPanel');

    return (
        <Providers store={store} history={history} appTitle={appTitle}>
            <AppContent userSettings={userSettings}>{children}</AppContent>
            {ChatPanel && <ChatPanel />}
            <ReduxTooltip />
        </Providers>
    );
}

function AppContent({
    userSettings,
    children,
}: {
    userSettings?: YDBEmbeddedUISettings;
    children?: React.ReactNode;
}) {
    const {appTitle} = useAppTitle();
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const fullscreenRootRef = React.useRef<HTMLDivElement>(null);

    return (
        <React.Fragment>
            <Helmet defaultTitle={appTitle} titleTemplate={`%s — ${appTitle}`} />
            <FullscreenProvider fullscreenRootRef={fullscreenRootRef}>
                <ContentWrapper>
                    <NavigationWrapper
                        singleClusterMode={singleClusterMode}
                        userSettings={userSettings}
                    >
                        <Content singleClusterMode={singleClusterMode}>{children}</Content>
                        <div ref={fullscreenRootRef}></div>
                    </NavigationWrapper>
                </ContentWrapper>
            </FullscreenProvider>
        </React.Fragment>
    );
}

export default App;
