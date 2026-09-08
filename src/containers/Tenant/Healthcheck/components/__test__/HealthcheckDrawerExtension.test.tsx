import React from 'react';

import {render, screen, waitFor} from '@testing-library/react';

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

function mockDrawerWrapper({
    isDrawerVisible,
    renderDrawerContent,
    children,
}: {
    isDrawerVisible: boolean;
    renderDrawerContent: () => React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <React.Fragment>
            {children}
            {isDrawerVisible ? renderDrawerContent() : null}
        </React.Fragment>
    );
}

jest.mock('../../../../../components/Drawer', () => ({DrawerWrapper: mockDrawerWrapper}));
jest.mock('../../../../../components/Fullscreen/Fullscreen', () => ({
    Fullscreen: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../../../../../utils/hooks', () => ({
    useTypedSelector: (selector: (state: {fullscreen: boolean}) => unknown) =>
        selector({fullscreen: false}),
}));
jest.mock('../../../../../utils/illustrations', () => ({
    getIllustration: () => () => null,
}));
jest.mock('../../useHealthcheck', () => ({useHealthcheck: () => mockHealthcheck}));
jest.mock('../HealthcheckFilter', () => ({HealthcheckFilter: () => null}));
jest.mock('../HealthcheckView', () => ({HealthcheckView: () => null}));
jest.mock('../HealthcheckRefresh', () => ({HealthcheckRefresh: () => null}));
jest.mock('../HealthcheckIssues', () => ({Issues: () => <div>Issue list</div>}));

function InsetProbe() {
    const {rightInset} = useDrawerContext();
    return <output data-testid="right-inset">{rightInset}</output>;
}

function DrawerFixture({open = true}: {open?: boolean}) {
    return (
        <DrawerContextProvider>
            <HealthcheckDrawer
                isDrawerVisible={open}
                onCloseDrawer={jest.fn()}
                renderDrawerContent={() => <Healthcheck database="/test" clusterName="cluster" />}
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
    );
}

describe('Healthcheck drawer extension', () => {
    const originalHealthcheck = {...uiFactory.healthcheck};
    const onMount = jest.fn();
    const onUnmount = jest.fn();

    function Extension() {
        const {setRightInset} = useDrawerContext();
        React.useEffect(() => {
            onMount();
            setRightInset(434);
            return () => {
                onUnmount();
                setRightInset(0);
            };
        }, [setRightInset]);
        return <span data-testid="drawer-extension" />;
    }

    beforeEach(() => {
        jest.clearAllMocks();
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
                renderAssistantAction: () => <button>Diagnostics</button>,
            },
        });
    });

    afterEach(() => {
        configureUIFactory({
            healthcheck: {renderDrawerExtension: undefined, ...originalHealthcheck},
        });
    });

    test('retains the extension and inset across data states, then cleans up on close', async () => {
        const {rerender, unmount} = render(<DrawerFixture />);
        await waitFor(() => expect(screen.getByTestId('right-inset')).toHaveTextContent('434'));
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
            expect(onMount).toHaveBeenCalledTimes(1);
            expect(onUnmount).not.toHaveBeenCalled();
        }

        mockHealthcheck = {
            ...mockHealthcheck,
            selfCheckResult: SelfCheckResult.DEGRADED,
            issues: [{id: 'next-issue'}],
            leavesIssues: [{id: 'next-issue', categoryForUI: 'storage'}],
        };
        rerender(<DrawerFixture />);
        expect(screen.getByRole('button', {name: 'Diagnostics'})).toBeInTheDocument();
        expect(onMount).toHaveBeenCalledTimes(1);

        rerender(<DrawerFixture open={false} />);
        expect(screen.queryByTestId('drawer-extension')).not.toBeInTheDocument();
        expect(screen.getByTestId('right-inset')).toHaveTextContent('0');
        expect(onUnmount).toHaveBeenCalledTimes(1);

        rerender(<DrawerFixture />);
        expect(onMount).toHaveBeenCalledTimes(2);
        unmount();
        expect(onUnmount).toHaveBeenCalledTimes(2);
    });

    test('does not render an extension while closed or without registration', () => {
        const {rerender} = render(<DrawerFixture open={false} />);
        expect(onMount).not.toHaveBeenCalled();
        configureUIFactory({healthcheck: {renderDrawerExtension: undefined}});
        rerender(<DrawerFixture />);
        expect(screen.getByText('Issue list')).toBeInTheDocument();
        expect(screen.getByTestId('right-inset')).toHaveTextContent('0');
        expect(screen.queryByTestId('drawer-extension')).not.toBeInTheDocument();
    });
});
