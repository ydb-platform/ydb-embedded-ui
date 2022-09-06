import React, {PropsWithChildren} from 'react';
import {Provider} from 'react-redux'
import {render} from '@testing-library/react'
import type {RenderOptions} from '@testing-library/react'

import configureStore from '../../store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    storeConfiguration?: {
        store?: any;
        history?: any;
    };
}

export const renderWithStore = (
    ui: React.ReactElement,
    {
        storeConfiguration = configureStore(),
        ...renderOptions
    }: ExtendedRenderOptions = {}
) => {
    const {store} = storeConfiguration;

    function Wrapper({children}: PropsWithChildren<{}>) {
        return <Provider store={store}>{children}</Provider>
    }

    return {store, ...render(ui, {wrapper: Wrapper, ...renderOptions})}
};
