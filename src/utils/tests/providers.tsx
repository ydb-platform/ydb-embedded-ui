import React from 'react';

import {render} from '@testing-library/react';
import type {RenderOptions} from '@testing-library/react';
import {Provider} from 'react-redux';

import {configureStore} from '../../store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    storeConfiguration?: {
        store?: any;
        history?: any;
    };
}

export const renderWithStore = (
    ui: React.ReactElement,
    {storeConfiguration = configureStore(), ...renderOptions}: ExtendedRenderOptions = {},
) => {
    const {store} = storeConfiguration;

    function Wrapper({children}: {children?: React.ReactNode}) {
        return <Provider store={store}>{children}</Provider>;
    }

    return {store, ...render(ui, {wrapper: Wrapper, ...renderOptions})};
};
