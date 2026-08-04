import React from 'react';

import {fireEvent, render, screen, within} from '@testing-library/react';

import {ComponentsProvider} from '../../../../components/ComponentsProvider/ComponentsProvider';
import {componentsRegistry} from '../../../../components/ComponentsProvider/componentsRegistry';
import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult, StatusFlag} from '../../../../types/api/healthcheck';
import type {IssueLog} from '../../../../types/api/healthcheck';
import {Healthcheck} from '../Healthcheck';
import type {HealthcheckAssistantActionProps} from '../types';
import {useClusterHealthcheck, useHealthcheck} from '../useHealthcheck';

jest.mock('../../../../components/ComponentsProvider/componentsRegistry', () => {
    const components = new Map();
    const registry = {
        set: jest.fn((id, component) => {
            components.set(id, component);
        }),
        get: jest.fn((id) => components.get(id)),
        has: jest.fn((id) => {
            const component = components.get(id);
            return component && component.name !== 'EmptyPlaceholder';
        }),
    };
    return {componentsRegistry: registry};
});
jest.mock('../useHealthcheck', () => ({
    useHealthcheck: jest.fn(),
    useClusterHealthcheck: jest.fn(),
}));
jest.mock('../../../../utils/hooks', () => ({
    useTypedSelector: () => false,
}));
jest.mock('../../../../utils/illustrations', () => ({
    getIllustration: () => () => <div>Success</div>,
}));
jest.mock('../../../../components/Fullscreen/Fullscreen', () => ({
    Fullscreen: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../../../../components/HealthcheckStatus/HealthcheckStatus', () => ({
    HealthcheckStatus: () => <div data-testid="healthcheck-status">Status</div>,
}));
jest.mock('../components/HealthcheckRefresh', () => ({
    HealthcheckRefresh: () => <button>Refresh</button>,
}));
jest.mock('../components/HealthcheckView', () => ({
    HealthcheckView: () => <div>View</div>,
}));
jest.mock('../components/HealthcheckFilter', () => ({
    HealthcheckFilter: () => <div>Filter</div>,
}));
jest.mock('../components/HealthcheckIssueDetails/HealthcheckIssueDetails', () => ({
    IssueDetails: () => <div>Issue details</div>,
}));
jest.mock('../components/HealthcheckIssueTabs', () => ({
    HealthcheckIssueTabs: () => <div>Issue tabs</div>,
}));
jest.mock('../../useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({
        view: 'unknown',
        issuesFilter: undefined,
        handleHealthcheckViewChange: jest.fn(),
        handleIssuesFilterChange: jest.fn(),
    }),
}));

const mockedUseHealthcheck = jest.mocked(useHealthcheck);
const mockedUseClusterHealthcheck = jest.mocked(useClusterHealthcheck);

const rawIssue: IssueLog = {
    id: 'issue-1',
    message: 'Disk is unavailable',
    status: StatusFlag.RED,
    type: 'UNKNOWN_TEST_ISSUE',
};
const visibleIssue: IssuesTree = {...rawIssue, categoryForUI: 'unknown'};

const successfulIssueResult = {
    leavesIssues: [visibleIssue],
    issues: [rawIssue],
    loading: false,
    error: undefined,
    successful: true,
    refetch: jest.fn(),
    selfCheckResult: SelfCheckResult.DEGRADED,
    fulfilledTimeStamp: 123_456,
};

function AssistantAction(props: HealthcheckAssistantActionProps) {
    return (
        <button data-testid={`${props.action}-action`}>
            {props.action === 'diagnostics' ? 'Diagnostics' : 'Fix'}
        </button>
    );
}

function renderHealthcheck(
    props:
        | {database: string; scope?: 'cluster' | 'database'}
        | {clusterName: string; scope?: 'cluster'},
) {
    componentsRegistry.set('HealthcheckAssistantAction', AssistantAction);

    return render(
        <ComponentsProvider registry={componentsRegistry}>
            <Healthcheck {...props} />
        </ComponentsProvider>,
    );
}

describe('HealthcheckAssistantAction', () => {
    beforeEach(() => {
        mockedUseHealthcheck.mockReturnValue(successfulIssueResult);
        mockedUseClusterHealthcheck.mockReturnValue(successfulIssueResult);
    });

    afterEach(() => {
        componentsRegistry.set('HealthcheckAssistantAction', function EmptyPlaceholder() {
            return null;
        });
        jest.clearAllMocks();
    });

    it('preserves the original controls and issue layout when the slot is not registered', () => {
        componentsRegistry.set('HealthcheckAssistantAction', function EmptyPlaceholder() {
            return null;
        });

        const {container} = render(
            <ComponentsProvider registry={componentsRegistry}>
                <Healthcheck database="/Root/database" />
            </ComponentsProvider>,
        );

        const statusRow = screen.getByTestId('healthcheck-status').parentElement;
        expect(screen.getByRole('button', {name: 'Refresh'}).parentElement).toBe(statusRow);
        expect(container.querySelector('.ydb-healthcheck__issue-action')).not.toBeInTheDocument();
    });

    test.each([
        {
            name: 'database target',
            props: {database: '/Root/database'},
            expectedTarget: {scope: 'database', request: {database: '/Root/database'}},
        },
        {
            name: 'cluster target with a database request',
            props: {database: '/Root', scope: 'cluster' as const},
            expectedTarget: {scope: 'cluster', request: {database: '/Root'}},
        },
        {
            name: 'cluster target with a cluster request',
            props: {clusterName: 'production-cluster'},
            expectedTarget: {
                scope: 'cluster',
                request: {clusterName: 'production-cluster'},
            },
        },
    ])('passes the exact $name and raw snapshot', ({props, expectedTarget}) => {
        const receivedProps: HealthcheckAssistantActionProps[] = [];
        componentsRegistry.set('HealthcheckAssistantAction', (actionProps) => {
            receivedProps.push(actionProps);
            return null;
        });

        render(
            <ComponentsProvider registry={componentsRegistry}>
                <Healthcheck {...props} />
            </ComponentsProvider>,
        );

        expect(receivedProps).toContainEqual({
            action: 'diagnostics',
            target: expectedTarget,
            snapshot: {
                selfCheckResult: SelfCheckResult.DEGRADED,
                issues: [rawIssue],
                fulfilledAt: 123_456,
            },
        });
        expect(receivedProps).toContainEqual({
            action: 'fix',
            target: expectedTarget,
            snapshot: {
                selfCheckResult: SelfCheckResult.DEGRADED,
                issues: [rawIssue],
                fulfilledAt: 123_456,
            },
            issue: rawIssue,
        });
    });

    test.each([
        {
            name: 'loading',
            result: {...successfulIssueResult, loading: true, successful: false},
        },
        {
            name: 'error',
            result: {
                ...successfulIssueResult,
                error: new Error('request failed'),
                successful: false,
            },
        },
        {
            name: 'GOOD',
            result: {
                ...successfulIssueResult,
                leavesIssues: [],
                issues: [],
                selfCheckResult: SelfCheckResult.GOOD,
            },
        },
        {
            name: 'no issues',
            result: {...successfulIssueResult, leavesIssues: [], issues: []},
        },
    ])('does not render diagnostics for $name state', ({result}) => {
        mockedUseHealthcheck.mockReturnValue(result);

        renderHealthcheck({database: '/Root/database'});

        expect(screen.queryByRole('button', {name: 'Diagnostics'})).not.toBeInTheDocument();
    });

    it('renders diagnostics in the status and refresh row only for a successful issue snapshot', () => {
        renderHealthcheck({database: '/Root/database'});

        const statusRow = screen.getByTestId('healthcheck-status').parentElement;
        expect(statusRow).toBeInTheDocument();
        expect(within(statusRow as HTMLElement).getByRole('button', {name: 'Diagnostics'})).toBe(
            screen.getByTestId('diagnostics-action'),
        );
        expect(
            within(statusRow as HTMLElement).getByRole('button', {name: 'Refresh'}),
        ).toBeVisible();
    });

    it('renders Fix in the issue action area without toggling issue expansion', () => {
        renderHealthcheck({database: '/Root/database'});

        const issueTrigger = screen.getByRole('button', {name: /Disk is unavailable/});
        const fixAction = screen.getByRole('button', {name: 'Fix'});
        const issueSummary = issueTrigger.closest('.ydb-healthcheck__issue-summary');

        expect(issueSummary).toContainElement(fixAction);
        expect(issueTrigger).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(fixAction);
        expect(issueTrigger).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(issueTrigger);
        expect(issueTrigger).toHaveAttribute('aria-expanded', 'true');
    });
});
