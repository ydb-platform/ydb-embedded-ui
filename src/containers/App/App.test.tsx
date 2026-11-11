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

test('keeps the Rubik stylesheet scoped to single-cluster mode', async () => {
    const store = configureStore({reducer: () => ({})});
    const history = createMemoryHistory();
    const app = () => (
        <HelmetProvider>
            <AppTitleProvider appTitle="YDB font test">
                <App store={store} history={history} />
            </AppTitleProvider>
        </HelmetProvider>
    );
    const fontLinks = () =>
        document.head.querySelectorAll(
            'link[rel="stylesheet"][href="https://fonts.googleapis.com/css2?family=Rubik&display=swap"]',
        );

    jest.mocked(useTypedSelector).mockReturnValue(false);
    const {rerender, unmount} = render(app());
    await waitFor(() => expect(document.title).toBe('YDB font test'));
    expect(fontLinks()).toHaveLength(0);

    jest.mocked(useTypedSelector).mockReturnValue(true);
    rerender(app());
    await waitFor(() => expect(fontLinks()).toHaveLength(1));
    rerender(app());
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(fontLinks()).toHaveLength(1);
    expect(document.title).toBe('YDB font test');

    jest.mocked(useTypedSelector).mockReturnValue(false);
    rerender(app());
    await waitFor(() => expect(fontLinks()).toHaveLength(0));

    jest.mocked(useTypedSelector).mockReturnValue(true);
    rerender(app());
    await waitFor(() => expect(fontLinks()).toHaveLength(1));
    unmount();
    await waitFor(() => expect(fontLinks()).toHaveLength(0));
});
