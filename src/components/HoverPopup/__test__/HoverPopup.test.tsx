import {act, fireEvent, render, screen} from '@testing-library/react';

import {HoverPopup} from '../HoverPopup';

jest.mock('@gravity-ui/uikit', () => ({
    Popup: ({children, open}: {children: React.ReactNode; open?: boolean}) =>
        open ? <div data-testid="popup">{children}</div> : null,
}));

describe('HoverPopup', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('allows rendered popup content to close the popup', () => {
        const onHidePopup = jest.fn();

        const renderPopupContent = jest.fn((controls?: {onClose: VoidFunction}) => (
            <button onClick={controls?.onClose} type="button">
                Close popup
            </button>
        ));

        const {container} = render(
            <HoverPopup
                delayOpen={0}
                delayClose={0}
                onHidePopup={onHidePopup}
                renderPopupContent={renderPopupContent}
            >
                <button type="button">Anchor</button>
            </HoverPopup>,
        );

        const anchor = container.querySelector('span');

        expect(anchor).not.toBeNull();

        fireEvent.mouseEnter(anchor as HTMLSpanElement);
        act(() => {
            jest.runOnlyPendingTimers();
        });

        expect(screen.getByTestId('popup')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', {name: 'Close popup'}));

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        expect(onHidePopup).toHaveBeenCalledTimes(1);
    });

    test('reports close from popup content when popup is controlled by props', () => {
        const onHidePopup = jest.fn();

        const renderPopupContent = jest.fn((controls?: {onClose: VoidFunction}) => (
            <button onClick={controls?.onClose} type="button">
                Close controlled popup
            </button>
        ));

        const {rerender} = render(
            <HoverPopup onHidePopup={onHidePopup} renderPopupContent={renderPopupContent}>
                <button type="button">Anchor</button>
            </HoverPopup>,
        );

        rerender(
            <HoverPopup showPopup onHidePopup={onHidePopup} renderPopupContent={renderPopupContent}>
                <button type="button">Anchor</button>
            </HoverPopup>,
        );

        expect(screen.getByTestId('popup')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', {name: 'Close controlled popup'}));

        expect(onHidePopup).toHaveBeenCalledTimes(1);
    });
});
