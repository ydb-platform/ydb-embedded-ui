import React from 'react';
import {Provider} from 'react-redux';
import {Router} from 'react-router';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';
import {ThemeProvider} from '@gravity-ui/uikit';

import {ComponentsProvider} from '../../components/ComponentsProvider/ComponentsProvider';
import {componentsRegistry as defaultComponentsRegistry} from '../../components/ComponentsProvider/componentsRegistry';
import {useSetting} from '../../utils/hooks';
import {THEME_KEY} from '../../utils/constants';

import type {Store} from 'redux';
import type {History} from 'history';
import type {ComponentsRegistry} from '../../components/ComponentsProvider/componentsRegistry';

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
    );
}

function Theme({children}: {children: React.ReactNode}) {
    const [theme] = useSetting<string | undefined>(THEME_KEY);

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
