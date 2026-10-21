import React from 'react';

import {Drawer, Popup, ThemeProvider, layerManager, useLayer} from '@gravity-ui/uikit';
import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {flushSync} from 'react-dom';

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

function SwitchingFixture({showSecond = true}: {showSecond?: boolean}) {
    const [target, setTarget] = React.useState<string>();
    return (
        <ThemeProvider theme="light">
            <DrawerContextProvider>
                <DrawerWrapper
                    title="Healthcheck"
                    isDrawerVisible={Boolean(target)}
                    focusReturnKey={target}
                    onCloseDrawer={() => setTarget(undefined)}
                    drawerControls={[{type: 'close'}]}
                    disableModal
                    renderDrawerContent={() => <input aria-label="Healthcheck filter" />}
                >
                    <button onClick={() => setTarget('first')}>Open first</button>
                    {showSecond ? (
                        <button onClick={() => setTarget('second')}>Open second</button>
                    ) : null}
                    <input aria-label="Page input" />
                </DrawerWrapper>
            </DrawerContextProvider>
        </ThemeProvider>
    );
}

async function switchToSecondOpener() {
    const first = screen.getByRole('button', {name: 'Open first'});
    first.focus();
    fireEvent.click(first);
    const drawer = await screen.findByRole('dialog', {name: 'Healthcheck'});
    await waitFor(() => expect(drawer).toHaveFocus());
    const second = screen.getByRole('button', {name: 'Open second'});
    second.focus();
    fireEvent.click(second);
    expect(screen.getByRole('dialog', {name: 'Healthcheck'})).toBe(drawer);
    return {first, second, drawer, filter: within(drawer).getByRole('textbox')};
}

test.each(['Close', 'Escape'])(
    'returns focus to the replacement opener after %s without remounting',
    async (close) => {
        render(<SwitchingFixture />);
        const {second, drawer, filter} = await switchToSecondOpener();
        if (close === 'Escape') {
            filter.focus();
            fireEvent.keyDown(filter, {key: 'Escape'});
        } else {
            const closeButton = within(drawer).getByRole('button', {name: 'Close'});
            act(() => closeButton.focus());
            fireEvent.click(closeButton);
        }
        await waitFor(() => expect(drawer).not.toBeInTheDocument());
        expect(second).toHaveFocus();
    },
);

test('does not steal external focus after replacing the target', async () => {
    render(<SwitchingFixture />);
    const {drawer} = await switchToSecondOpener();
    const pageInput = screen.getByRole('textbox', {name: 'Page input'});
    pageInput.focus();
    fireEvent.click(within(drawer).getByRole('button', {name: 'Close'}));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    expect(pageInput).toHaveFocus();
});

test('does not restore a detached replacement opener', async () => {
    const {rerender} = render(<SwitchingFixture />);
    const {first, second, drawer, filter} = await switchToSecondOpener();
    filter.focus();
    rerender(<SwitchingFixture showSecond={false} />);
    expect(second).not.toBeInTheDocument();
    fireEvent.keyDown(filter, {key: 'Escape'});
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    expect(document.body).toHaveFocus();
    expect(first).not.toHaveFocus();
});

test('captures a fresh opener after close and reopen', async () => {
    render(<SwitchingFixture />);
    const {first, second, drawer: previousDrawer, filter} = await switchToSecondOpener();
    filter.focus();
    fireEvent.keyDown(filter, {key: 'Escape'});
    await waitFor(() => expect(second).toHaveFocus());
    await waitFor(() => expect(previousDrawer).not.toBeInTheDocument());

    first.focus();
    fireEvent.click(first);
    const drawer = await screen.findByRole('dialog', {name: 'Healthcheck'});
    await waitFor(() => expect(drawer).toHaveFocus());
    const reopenedFilter = within(drawer).getByRole('textbox');
    reopenedFilter.focus();
    fireEvent.keyDown(reopenedFilter, {key: 'Escape'});
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    expect(first).toHaveFocus();
});

function NestedLayer({removeBeforeBubble = false}: {removeBeforeBubble?: boolean}) {
    const [open, setOpen] = React.useState(true);
    useLayer({open, type: 'popup', onEscapeKeyDown: () => setOpen(false)});
    return (
        <input
            aria-label="Nested layer"
            onKeyDown={(event) => {
                if (removeBeforeBubble && event.key === 'Escape') {
                    flushSync(() => setOpen(false));
                }
            }}
        />
    );
}

function LayerFixture({
    disableModal = true,
    content,
    visible = true,
    onClose = jest.fn(),
}: {
    disableModal?: boolean;
    content?: React.ReactNode;
    visible?: boolean;
    onClose?: () => void;
}) {
    return (
        <ThemeProvider theme="light">
            <DrawerContextProvider>
                <DrawerWrapper
                    title="Layer drawer"
                    isDrawerVisible={visible}
                    onCloseDrawer={onClose}
                    disableModal={disableModal}
                    renderDrawerContent={() => content ?? <input aria-label="Layer input" />}
                >
                    <button>Layer opener</button>
                </DrawerWrapper>
            </DrawerContextProvider>
        </ThemeProvider>
    );
}

function InitiallyOpenPopup() {
    const anchor = React.useRef<HTMLInputElement>(null);
    return (
        <React.Fragment>
            <input ref={anchor} aria-label="Popup anchor" />
            <Popup open anchorRef={anchor}>
                <button>Popup item</button>
            </Popup>
        </React.Fragment>
    );
}

test.each([true, false])(
    'registers before an initially open popup (non-modal=%s)',
    async (disableModal) => {
        const baseline = layerManager.getLayers();
        const close = jest.fn();
        const {unmount} = render(
            <LayerFixture
                disableModal={disableModal}
                onClose={close}
                content={<InitiallyOpenPopup />}
            />,
        );
        const input = await screen.findByRole('textbox', {name: 'Popup anchor'});
        await waitFor(() =>
            expect(screen.getByRole('dialog', {name: 'Layer drawer'})).toHaveFocus(),
        );
        expect(
            layerManager
                .getLayers()
                .slice(baseline.length)
                .map((layer) => layer.type),
        ).toEqual([expect.stringContaining('ydb-drawer-'), 'popup']);
        input.focus();
        fireEvent.keyDown(input, {key: 'Escape'});
        expect(close).not.toHaveBeenCalled();
        unmount();
        expect(layerManager.getLayers()).toEqual(baseline);
    },
);

test.each([true, false])(
    'remembers a popup removed before the same Escape bubbles (non-modal=%s)',
    async (disableModal) => {
        const close = jest.fn();
        render(
            <LayerFixture
                disableModal={disableModal}
                onClose={close}
                content={<NestedLayer removeBeforeBubble />}
            />,
        );
        const input = await screen.findByRole('textbox', {name: 'Nested layer'});
        await waitFor(() =>
            expect(screen.getByRole('dialog', {name: 'Layer drawer'})).toHaveFocus(),
        );
        input.focus();
        fireEvent.keyDown(input, {key: 'Escape'});
        expect(close).not.toHaveBeenCalled();
        fireEvent.keyDown(input, {key: 'Escape'});
        expect(close).toHaveBeenCalledTimes(1);
    },
);

test('keeps marker order across rerender and cleans up in StrictMode', async () => {
    const baseline = layerManager.getLayers();
    const close = jest.fn();
    const fixture = (visible: boolean) => (
        <React.StrictMode>
            <LayerFixture visible={visible} onClose={close} content={<NestedLayer />} />
        </React.StrictMode>
    );
    const {rerender, unmount} = render(fixture(true));
    await screen.findByRole('textbox', {name: 'Nested layer'});
    const layers = layerManager.getLayers();
    expect(layers.slice(baseline.length).map((layer) => layer.type)).toEqual([
        expect.stringContaining('ydb-drawer-'),
        'popup',
    ]);
    rerender(fixture(true));
    expect(layerManager.getLayers()).toEqual(layers);
    rerender(fixture(false));
    expect(
        layerManager.getLayers().filter((layer) => layer.type?.startsWith('ydb-drawer-')),
    ).toEqual([]);
    unmount();
    expect(layerManager.getLayers()).toEqual(baseline);
});

test('another non-modal drawer does not block Escape in the focused drawer', async () => {
    const firstClose = jest.fn();
    const secondClose = jest.fn();
    render(
        <React.Fragment>
            <LayerFixture onClose={firstClose} content={<input aria-label="First layer" />} />
            <LayerFixture onClose={secondClose} content={<input aria-label="Second layer" />} />
        </React.Fragment>,
    );
    const first = await screen.findByRole('textbox', {name: 'First layer'});
    const second = screen.getByRole('textbox', {name: 'Second layer'});
    first.focus();
    fireEvent.keyDown(first, {key: 'Escape'});
    expect(firstClose).toHaveBeenCalledTimes(1);
    expect(secondClose).not.toHaveBeenCalled();
    second.focus();
    fireEvent.keyDown(second, {key: 'Escape'});
    expect(secondClose).toHaveBeenCalledTimes(1);
});
