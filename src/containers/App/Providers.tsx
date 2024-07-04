import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
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
import {THEME_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

interface ProvidersProps {
    store: Store;
    history: History;
    componentsRegistry?: ComponentsRegistry;
    children: React.ReactNode;
}

export function Providers({
    store,
    history,
    componentsRegistry = defaultComponentsRegistry,
    children,
}: ProvidersProps) {
    return (
        <HelmetProvider>
            <Provider store={store}>
                <Router history={history}>
                    <QueryParamProvider adapter={ReactRouter5Adapter}>
                        <Theme>
                            <ComponentsProvider registry={componentsRegistry}>
                                {children}
                            </ComponentsProvider>
                        </Theme>
                    </QueryParamProvider>
                </Router>
            </Provider>
        </HelmetProvider>
    );
}

function Theme({children}: {children: React.ReactNode}) {
    const [theme] = useSetting<string | undefined>(THEME_KEY);

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
