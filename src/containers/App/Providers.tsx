import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import {ThemeProvider, ToasterComponent, ToasterProvider} from '@gravity-ui/uikit';
import type {Store} from '@reduxjs/toolkit';
import type {History} from 'history';
import {HelmetProvider} from 'react-helmet-async';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {ComponentsProvider} from '../../components/ComponentsProvider/ComponentsProvider';
import {componentsRegistry as defaultComponentsRegistry} from '../../components/ComponentsProvider/componentsRegistry';
import type {ComponentsRegistry} from '../../components/ComponentsProvider/componentsRegistry';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {toaster} from '../../utils/createToast';
import {useSetting} from '../../utils/hooks';

import {AppTitleProvider} from './AppTitleContext';

interface ProvidersProps {
    store: Store;
    history: History;
    componentsRegistry?: ComponentsRegistry;
    children: React.ReactNode;
    appTitle: string;
}

export function Providers({
    store,
    history,
    componentsRegistry = defaultComponentsRegistry,
    children,
    appTitle,
}: ProvidersProps) {
    return (
        <HelmetProvider>
            <Provider store={store}>
                <Router history={history}>
                    <QueryParamProvider adapter={ReactRouter5Adapter}>
                        <AppTitleProvider appTitle={appTitle}>
                            <Theme>
                                <ToasterProvider toaster={toaster}>
                                    <ComponentsProvider registry={componentsRegistry}>
                                        <NiceModal.Provider>{children}</NiceModal.Provider>
                                        <ToasterComponent />
                                    </ComponentsProvider>
                                </ToasterProvider>
                            </Theme>
                        </AppTitleProvider>
                    </QueryParamProvider>
                </Router>
            </Provider>
        </HelmetProvider>
    );
}

function Theme({children}: {children: React.ReactNode}) {
    const [theme] = useSetting<string | undefined>(SETTING_KEYS.THEME);

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
