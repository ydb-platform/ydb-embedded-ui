import React from 'react';

import {act, render, screen, waitFor} from '@testing-library/react';

import {DrawerWrapper} from '../Drawer';
import {DrawerContextProvider, isClickInRightInset, useDrawerContext} from '../DrawerContext';

const mockSaveWidth = jest.fn();
let mockSavedWidth = '600';
let mockDrawerProps: {
    maxSize?: number;
    onResizeEnd?: (width: number) => void;
    size?: number;
    style?: React.CSSProperties;
};

jest.mock('../../../utils/hooks/useSetting', () => ({
    useSetting: () => [mockSavedWidth, mockSaveWidth],
}));
jest.mock('@gravity-ui/uikit', () => {
    const actual = jest.requireActual('@gravity-ui/uikit');
    return {
        ...actual,
        Drawer: (props: typeof mockDrawerProps & {children: React.ReactNode; open: boolean}) => {
            mockDrawerProps = props;
            return props.open ? <div data-testid="gravity-drawer">{props.children}</div> : null;
        },
    };
});

class ResizeObserverMock {
    static instances: ResizeObserverMock[] = [];

    callback: ResizeObserverCallback;
    disconnect = jest.fn();
    observe = jest.fn();
    unobserve = jest.fn();

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        ResizeObserverMock.instances.push(this);
    }
}

function InsetController({inset}: {inset: number}) {
    const {setRightInset} = useDrawerContext();

    React.useEffect(() => {
        setRightInset(inset);
        return () => {
            setRightInset(0);
        };
    }, [inset, setRightInset]);

    return null;
}

function ContextProbe() {
    const {containerWidth, rightInset} = useDrawerContext();
    return (
        <div data-testid="context-probe">
            {containerWidth}:{rightInset}
        </div>
    );
}

function DrawerHarness({
    showController = true,
    inset = 320,
    isPercentageWidth = false,
}: {
    showController?: boolean;
    inset?: number;
    isPercentageWidth?: boolean;
}) {
    return (
        <DrawerContextProvider>
            {showController ? <InsetController inset={inset} /> : null}
            <ContextProbe />
            <DrawerWrapper
                isDrawerVisible
                onCloseDrawer={jest.fn()}
                renderDrawerContent={() => <div>Healthcheck drawer</div>}
                storageKey="healthcheck-width"
                isPercentageWidth={isPercentageWidth}
            >
                <main>Page</main>
            </DrawerWrapper>
        </DrawerContextProvider>
    );
}

describe('drawer right inset', () => {
    let containerWidth = 1_000;

    beforeEach(() => {
        containerWidth = 1_000;
        mockSavedWidth = '600';
        mockDrawerProps = {};
        mockSaveWidth.mockClear();
        ResizeObserverMock.instances = [];
        global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
            () =>
                ({
                    bottom: 800,
                    height: 800,
                    left: 0,
                    right: containerWidth,
                    top: 0,
                    width: containerWidth,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                }) as DOMRect,
        );
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('reserves and dynamically releases the right inset without overwriting saved width', async () => {
        const {rerender} = render(<DrawerHarness />);

        await waitFor(() => {
            expect(screen.getByTestId('context-probe')).toHaveTextContent('1000:320');
        });
        expect(mockDrawerProps.maxSize).toBe(680);
        expect(mockDrawerProps.style).toEqual({overflow: 'hidden', width: 680});
        expect(mockDrawerProps.size).toBe(600);
        expect(mockSaveWidth).not.toHaveBeenCalled();

        rerender(<DrawerHarness showController={false} />);

        await waitFor(() => {
            expect(screen.getByTestId('context-probe')).toHaveTextContent('1000:0');
        });
        expect(mockDrawerProps.maxSize).toBe(1_000);
        expect(mockDrawerProps.size).toBe(600);
        expect(mockSaveWidth).not.toHaveBeenCalled();
    });

    it('recalculates available width on resize and disconnects the observer on cleanup', async () => {
        const {unmount} = render(<DrawerHarness inset={250} />);

        await waitFor(() => {
            expect(screen.getByTestId('context-probe')).toHaveTextContent('1000:250');
        });

        containerWidth = 900;
        act(() => {
            ResizeObserverMock.instances[0].callback([], ResizeObserverMock.instances[0]);
        });

        expect(screen.getByTestId('context-probe')).toHaveTextContent('900:250');
        expect(mockDrawerProps.maxSize).toBe(650);

        unmount();
        expect(ResizeObserverMock.instances[0].disconnect).toHaveBeenCalledTimes(1);
    });

    it('converts a pixel resize against the full width and persists only the user resize', async () => {
        jest.useFakeTimers();
        render(<DrawerHarness inset={250} />);

        expect(mockDrawerProps.maxSize).toBe(750);

        act(() => {
            mockDrawerProps.onResizeEnd?.(500);
        });

        expect(mockDrawerProps.size).toBe(500);
        expect(mockSaveWidth).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(200);
        });
        expect(mockSaveWidth).toHaveBeenCalledWith('500');
        jest.useRealTimers();
    });

    it('keeps a fitting percentage width independent and clamps only while it collides', async () => {
        mockSavedWidth = '60';
        const {rerender} = render(<DrawerHarness inset={320} isPercentageWidth />);

        await waitFor(() => {
            expect(mockDrawerProps.maxSize).toBe(680);
        });
        expect(mockDrawerProps.size).toBe(600);
        expect(mockSaveWidth).not.toHaveBeenCalled();

        rerender(<DrawerHarness inset={500} isPercentageWidth />);

        await waitFor(() => {
            expect(mockDrawerProps.maxSize).toBe(500);
        });
        expect(mockDrawerProps.size).toBe(500);
        expect(mockSaveWidth).not.toHaveBeenCalled();

        rerender(<DrawerHarness showController={false} isPercentageWidth />);

        await waitFor(() => {
            expect(mockDrawerProps.maxSize).toBe(1_000);
        });
        expect(mockDrawerProps.size).toBe(600);
        expect(mockSaveWidth).not.toHaveBeenCalled();
    });

    it('persists a percentage resize against the full width without jumping on release', async () => {
        jest.useFakeTimers();
        mockSavedWidth = '60';
        const {rerender} = render(<DrawerHarness inset={320} isPercentageWidth />);

        expect(mockDrawerProps.maxSize).toBe(680);

        act(() => {
            mockDrawerProps.onResizeEnd?.(500);
        });
        expect(mockDrawerProps.size).toBe(500);

        act(() => {
            jest.advanceTimersByTime(200);
        });
        expect(mockSaveWidth).toHaveBeenCalledWith('50');

        rerender(<DrawerHarness showController={false} isPercentageWidth />);
        expect(mockDrawerProps.size).toBe(500);
        jest.useRealTimers();
    });

    it('passes an explicit zero width constraint when the inset consumes the container', async () => {
        render(<DrawerHarness inset={1_000} />);

        await waitFor(() => {
            expect(mockDrawerProps.maxSize).toBe(0);
        });
        expect(mockDrawerProps.size).toBe(0);
        expect(mockDrawerProps.style).toEqual({overflow: 'hidden', width: 0});
    });

    it('identifies clicks in the adjacent right inset', () => {
        const itemContainer = document.createElement('div');
        jest.spyOn(itemContainer, 'getBoundingClientRect').mockReturnValue({
            bottom: 800,
            height: 800,
            left: 0,
            right: 700,
            top: 0,
            width: 700,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        expect(
            isClickInRightInset(new MouseEvent('click', {clientX: 750}), itemContainer, 300),
        ).toBe(true);
        expect(
            isClickInRightInset(new MouseEvent('click', {clientX: 650}), itemContainer, 300),
        ).toBe(false);
        expect(isClickInRightInset(new MouseEvent('click', {clientX: 750}), itemContainer, 0)).toBe(
            false,
        );
    });
});
