import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {render, waitFor} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {HelmetProvider} from 'react-helmet-async';

import {useTypedSelector} from '../../utils/hooks/useTypedSelector';

import App from './App';
import {AppTitleProvider} from './AppTitleContext';

jest.mock('../../utils/hooks/useTypedSelector', () => ({useTypedSelector: jest.fn()}));
jest.mock('../../uiFactory/uiFactory', () => ({uiFactory: {}}));
jest.mock('./Providers', () => ({
    Providers: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../../components/Fullscreen/FullscreenContext', () => ({
    FullscreenProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('./Content', () => ({
    __esModule: true,
    default: ({children}: {children: React.ReactNode}) => children,
    Content: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('./NavigationWrapper', () => ({
    NavigationWrapper: ({children}: {children: React.ReactNode}) => children,
}));

test('loads the embedded font as a separate stylesheet and removes it in multi-cluster mode', async () => {
    const store = configureStore({reducer: () => ({})});
    const history = createMemoryHistory();
    const app = (
        <HelmetProvider>
            <AppTitleProvider appTitle="YDB">
                <App store={store} history={history} />
            </AppTitleProvider>
        </HelmetProvider>
    );
    const fontLink = () =>
        document.head.querySelector(
            'link[rel="stylesheet"][href="https://fonts.googleapis.com/css2?family=Rubik&display=swap"]',
        );

    jest.mocked(useTypedSelector).mockReturnValue(true);
    const {rerender} = render(app);
    await waitFor(() => expect(fontLink()).not.toBeNull());

    jest.mocked(useTypedSelector).mockReturnValue(false);
    rerender(
        <HelmetProvider>
            <AppTitleProvider appTitle="YDB">
                <App store={store} history={history} />
            </AppTitleProvider>
        </HelmetProvider>,
    );
    await waitFor(() => expect(fontLink()).toBeNull());
});
