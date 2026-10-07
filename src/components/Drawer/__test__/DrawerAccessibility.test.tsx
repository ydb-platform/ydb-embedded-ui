import React from 'react';

import {Drawer, ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';

import {DrawerWrapper} from '../Drawer';
import {DrawerContextProvider} from '../DrawerContext';

jest.mock('../../../utils/hooks/useSetting', () => ({
    useSetting: () => [undefined, jest.fn()],
}));

function Fixture() {
    const [healthcheck, setHealthcheck] = React.useState(false);
    const [assistant, setAssistant] = React.useState(false);
    return (
        <ThemeProvider theme="light">
            <DrawerContextProvider>
                <DrawerWrapper
                    title="Healthcheck"
                    isDrawerVisible={healthcheck}
                    onCloseDrawer={() => setHealthcheck(false)}
                    drawerControls={[{type: 'close'}]}
                    disableModal
                    renderDrawerContent={() => <input aria-label="Healthcheck filter" />}
                >
                    <button onClick={() => setHealthcheck(true)}>Open Healthcheck</button>
                    <button onClick={() => setAssistant(true)}>Open assistant</button>
                </DrawerWrapper>
            </DrawerContextProvider>
            <Drawer
                open={assistant}
                disableModal
                hideVeil
                aria-label="Assistant"
                disableEscapeKeyDown
            >
                <button onClick={() => setAssistant(false)}>Close assistant</button>
            </Drawer>
        </ThemeProvider>
    );
}

const originalResizeObserver = window.ResizeObserver;
beforeEach(() => {
    window.ResizeObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        width: 1400,
        height: 800,
        right: 1400,
        bottom: 800,
        toJSON() {},
    });
});
afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    jest.restoreAllMocks();
});

test('returns focus to its opener after visiting the adjacent panel', async () => {
    render(<Fixture />);
    const opener = screen.getByRole('button', {name: 'Open Healthcheck'});
    opener.focus();
    fireEvent.click(opener);
    const healthcheck = await screen.findByRole('dialog', {name: 'Healthcheck'});
    const assistantOpener = screen.getByRole('button', {name: 'Open assistant'});
    assistantOpener.focus();
    fireEvent.click(assistantOpener);
    await screen.findByRole('dialog', {name: 'Assistant'});
    within(healthcheck).getByRole('textbox').focus();
    fireEvent.keyDown(within(healthcheck).getByRole('textbox'), {key: 'Escape'});
    await waitFor(() => expect(opener).toHaveFocus());
    expect(screen.getByRole('dialog', {name: 'Assistant'})).toBeInTheDocument();
});

test('does not steal focus from an adjacent panel when closed externally', async () => {
    render(<Fixture />);
    const opener = screen.getByRole('button', {name: 'Open Healthcheck'});
    opener.focus();
    fireEvent.click(opener);
    const healthcheck = await screen.findByRole('dialog', {name: 'Healthcheck'});
    fireEvent.click(screen.getByRole('button', {name: 'Open assistant'}));
    const assistantClose = await screen.findByRole('button', {name: 'Close assistant'});
    await waitFor(() => expect(screen.getByRole('dialog', {name: 'Assistant'})).toHaveFocus());
    assistantClose.focus();
    fireEvent.click(within(healthcheck).getByRole('button', {name: 'Close'}));
    await waitFor(() =>
        expect(screen.queryByRole('dialog', {name: 'Healthcheck'})).not.toBeInTheDocument(),
    );
    expect(assistantClose).toHaveFocus();
});
