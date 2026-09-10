import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';

import {
    DrawerContextProvider,
    useDrawerContext,
} from '../../../../../components/Drawer/DrawerContext';
import {SelfCheckResult} from '../../../../../types/api/healthcheck';
import {configureUIFactory, uiFactory} from '../../../../../uiFactory/uiFactory';
import {Healthcheck} from '../../Healthcheck';
import type {useHealthcheck} from '../../useHealthcheck';
import {HealthcheckDrawer} from '../HealthcheckDrawer';

let mockHealthcheck: ReturnType<typeof useHealthcheck>;

jest.mock('../../../../../components/Fullscreen/Fullscreen', () => ({
    Fullscreen: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../../../../../utils/hooks', () => ({
    useTypedDispatch: () => jest.fn(),
    useTypedSelector: (selector: (state: {fullscreen: boolean}) => unknown) =>
        selector({fullscreen: false}),
}));
jest.mock('../../../../../utils/illustrations', () => ({
    getIllustration: () => () => null,
}));
jest.mock('../../useHealthcheck', () => ({useHealthcheck: () => mockHealthcheck}));
jest.mock('../HealthcheckFilter', () => ({HealthcheckFilter: () => null}));
jest.mock('../HealthcheckView', () => ({HealthcheckView: () => null}));
jest.mock('../HealthcheckIssues', () => ({Issues: () => <div>Issue list</div>}));

jest.mock('../../../../../utils/hooks/useSetting', () => ({
    useSetting: () => [undefined, jest.fn()],
}));

function InsetProbe() {
    const {rightInset} = useDrawerContext();
    return <output data-testid="right-inset">{rightInset}</output>;
}

const onInsetChange = jest.fn();
const actionTargets = jest.fn();
const originalResizeObserver = window.ResizeObserver;

function DrawerFixture({
    open = true,
    database = '/test',
    clusterName = 'cluster',
}: {
    open?: boolean;
    database?: string;
    clusterName?: string;
}) {
    return (
        <ThemeProvider theme="light">
            <DrawerContextProvider onRightInsetChange={onInsetChange}>
                <HealthcheckDrawer
                    isDrawerVisible={open}
                    onCloseDrawer={jest.fn()}
                    renderDrawerContent={() => (
                        <Healthcheck database={database} clusterName={clusterName} />
                    )}
                    drawerId="healthcheck"
                    storageKey="healthcheck"
                    title="Healthcheck"
                    healthcheckData={undefined}
                    downloadFilePrefix="healthcheck"
                    downloadTooltip="Download"
                >
                    <InsetProbe />
                </HealthcheckDrawer>
            </DrawerContextProvider>
        </ThemeProvider>
    );
}

describe('Healthcheck drawer extension', () => {
    const originalHealthcheck = {...uiFactory.healthcheck};

    function Extension() {
        const {setRightInset} = useDrawerContext();
        React.useEffect(() => {
            setRightInset(434);
            return () => {
                setRightInset(0);
            };
        }, [setRightInset]);
        return <span data-testid="drawer-extension" />;
    }

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            width: 1389,
            height: 764,
            right: 1389,
            bottom: 764,
            toJSON() {},
        });
        window.ResizeObserver = jest.fn(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }));
        mockHealthcheck = {
            loading: false,
            successful: true,
            error: undefined,
            selfCheckResult: SelfCheckResult.DEGRADED,
            fulfilledTimeStamp: 1,
            issues: [{id: 'issue'}],
            leavesIssues: [{id: 'issue', categoryForUI: 'storage'}],
            refetch: jest.fn(),
        };
        configureUIFactory({
            healthcheck: {
                renderDrawerExtension: () => <Extension />,
                renderAssistantAction: (props) => {
                    actionTargets(props.target);
                    return <button>Diagnostics</button>;
                },
            },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.ResizeObserver = originalResizeObserver;
        configureUIFactory({
            healthcheck: {
                renderDrawerExtension: undefined,
                renderAssistantAction: undefined,
                ...originalHealthcheck,
            },
        });
        expect(uiFactory.healthcheck.renderAssistantAction).toBe(
            originalHealthcheck.renderAssistantAction,
        );
        expect(uiFactory.healthcheck.renderDrawerExtension).toBe(
            originalHealthcheck.renderDrawerExtension,
        );
    });

    test('retains the extension and inset across data states, then cleans up on close', () => {
        const degraded = mockHealthcheck;
        const {rerender, unmount} = render(<DrawerFixture />);
        expect(screen.getByTestId('right-inset')).toHaveTextContent('434');
        expect(screen.getByRole('button', {name: 'Diagnostics'})).toBeInTheDocument();

        const states = [
            {selfCheckResult: SelfCheckResult.GOOD, issues: [], leavesIssues: []},
            {loading: true, successful: false},
            {loading: false, error: {message: 'Unavailable'}},
            {error: undefined, successful: true, selfCheckResult: SelfCheckResult.GOOD},
        ];
        for (const state of states) {
            mockHealthcheck = {...mockHealthcheck, ...state};
            rerender(<DrawerFixture />);
            expect(screen.getByTestId('drawer-extension')).toBeInTheDocument();
            expect(screen.getByTestId('right-inset')).toHaveTextContent('434');
            expect(screen.queryByRole('button', {name: 'Diagnostics'})).not.toBeInTheDocument();
            expect(onInsetChange.mock.calls).toEqual([[434]]);
        }

        mockHealthcheck = degraded;
        rerender(<DrawerFixture />);
        expect(screen.getByRole('button', {name: 'Diagnostics'})).toBeInTheDocument();
        expect(onInsetChange.mock.calls).toEqual([[434]]);

        rerender(<DrawerFixture open={false} />);
        expect(screen.queryByTestId('drawer-extension')).not.toBeInTheDocument();
        expect(screen.getByTestId('right-inset')).toHaveTextContent('0');
        expect(onInsetChange.mock.calls).toEqual([[434], [0]]);

        rerender(<DrawerFixture />);
        expect(onInsetChange.mock.calls).toEqual([[434], [0], [434]]);
        unmount();
        expect(onInsetChange.mock.calls).toEqual([[434], [0], [434], [0]]);
    });

    test('keeps the extension mounted while Diagnostics receives the new target', () => {
        const {rerender} = render(<DrawerFixture database="/first" clusterName="alpha" />);
        const extension = screen.getByTestId('drawer-extension');
        expect(actionTargets).toHaveBeenLastCalledWith({
            scope: 'database',
            request: {database: '/first', clusterName: 'alpha'},
        });
        rerender(<DrawerFixture database="/second" clusterName="beta" />);
        expect(screen.getByTestId('drawer-extension')).toBe(extension);
        expect(onInsetChange.mock.calls).toEqual([[434]]);
        expect(actionTargets).toHaveBeenLastCalledWith({
            scope: 'database',
            request: {database: '/second', clusterName: 'beta'},
        });
    });

    test('renders the extension after the header and before Healthcheck', () => {
        render(<DrawerFixture />);
        const extension = screen.getByTestId('drawer-extension');
        expect(extension.parentElement).toHaveClass('ydb-drawer__content-wrapper');
        expect(extension.previousElementSibling).toContainElement(screen.getByText('Healthcheck'));
        expect(extension.nextElementSibling).toContainElement(
            screen.getByRole('button', {name: 'Diagnostics'}),
        );
    });

    test('does not render an extension while closed or without registration', () => {
        const {rerender} = render(<DrawerFixture open={false} />);
        expect(onInsetChange).not.toHaveBeenCalled();
        configureUIFactory({healthcheck: {renderDrawerExtension: undefined}});
        rerender(<DrawerFixture />);
        expect(screen.getByText('Issue list')).toBeInTheDocument();
        expect(screen.getByTestId('right-inset')).toHaveTextContent('0');
        expect(screen.queryByTestId('drawer-extension')).not.toBeInTheDocument();
    });
});
