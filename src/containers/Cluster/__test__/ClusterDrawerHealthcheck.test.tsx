import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen, waitFor} from '@testing-library/react';

import {DrawerContextProvider} from '../../../components/Drawer/DrawerContext';
import {configureUIFactory, uiFactory} from '../../../uiFactory/uiFactory';
import {ClusterDrawerHealthcheck} from '../ClusterDrawerHealthcheck';

let mockShowHealthcheck = false;
const mockSetQueryParams = jest.fn();
jest.mock('use-query-params', () => ({
    ...jest.requireActual('use-query-params'),
    useQueryParams: () => [{showHealthcheck: mockShowHealthcheck}, mockSetQueryParams],
}));
jest.mock('../../../utils/hooks', () => ({
    useTypedSelector: () => undefined,
    useTypedDispatch: () => jest.fn(),
}));
jest.mock('../../../utils/hooks/useSetting', () => ({
    useSetting: () => [undefined, jest.fn()],
}));
jest.mock('../../Tenant/Healthcheck/Healthcheck', () => ({
    Healthcheck: () => <input aria-label="Healthcheck filter" />,
}));

const originalResizeObserver = window.ResizeObserver;
const originalHealthcheck = {...uiFactory.healthcheck};
beforeEach(() => {
    mockShowHealthcheck = false;
    configureUIFactory({healthcheck: {disableModal: true}});
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
    configureUIFactory({healthcheck: originalHealthcheck});
    jest.restoreAllMocks();
});

test.each([true, false])(
    'clears the explicit ref after focus restoration and reopens (non-modal=%s)',
    async (disableModal) => {
        configureUIFactory({healthcheck: {disableModal}});
        const openerRef: React.MutableRefObject<HTMLElement | null> = {current: null};
        const fixture = () => (
            <ThemeProvider theme="light">
                <DrawerContextProvider>
                    <ClusterDrawerHealthcheck database="/local" returnFocusRef={openerRef}>
                        <button>First opener</button>
                        <button>Second opener</button>
                    </ClusterDrawerHealthcheck>
                </DrawerContextProvider>
            </ThemeProvider>
        );
        const {rerender} = render(fixture());
        const first = screen.getByRole('button', {name: 'First opener'});
        const second = screen.getByRole('button', {name: 'Second opener'});
        for (const opener of [first, second]) {
            first.focus();
            openerRef.current = opener;
            mockShowHealthcheck = true;
            rerender(fixture());
            const drawer = await screen.findByRole('dialog');
            await waitFor(() => expect(drawer).toHaveFocus());
            expect(openerRef.current).toBe(opener);
            mockShowHealthcheck = false;
            rerender(fixture());
            // Clearing before the child's layout effect would lose this explicit target.
            expect(opener).toHaveFocus();
            expect(openerRef.current).toBeNull();
            await waitFor(() => expect(drawer).not.toBeInTheDocument());
        }
    },
);
