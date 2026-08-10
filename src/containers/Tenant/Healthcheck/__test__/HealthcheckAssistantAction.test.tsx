import React from 'react';

import {fireEvent, render, screen} from '@testing-library/react';

import {ComponentsProvider} from '../../../../components/ComponentsProvider/ComponentsProvider';
import {componentsRegistry} from '../../../../components/ComponentsProvider/componentsRegistry';
import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult, StatusFlag} from '../../../../types/api/healthcheck';
import type {IssueLog} from '../../../../types/api/healthcheck';
import {Healthcheck} from '../Healthcheck';
import type {HealthcheckAssistantActionProps, HealthcheckAssistantTarget} from '../types';
import {useClusterHealthcheck, useHealthcheck} from '../useHealthcheck';

jest.mock('../../../../components/ComponentsProvider/componentsRegistry', () => {
    const components = new Map();
    const registry = {
        set: jest.fn((id, component) => {
            components.set(id, component);
        }),
        get: jest.fn((id) => components.get(id)),
        has: jest.fn(() => false),
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
    jest.mocked(componentsRegistry.has).mockReturnValue(true);

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
        jest.mocked(componentsRegistry.has).mockReturnValue(false);
        jest.clearAllMocks();
    });

    it('preserves the original controls and issue layout when the slot is not registered', () => {
        componentsRegistry.set('HealthcheckAssistantAction', function EmptyPlaceholder() {
            return null;
        });
        jest.mocked(componentsRegistry.has).mockReturnValue(false);

        const {container} = render(
            <ComponentsProvider registry={componentsRegistry}>
                <Healthcheck database="/Root/database" />
            </ComponentsProvider>,
        );

        const statusRow = screen.getByTestId('healthcheck-status').parentElement;
        expect(screen.getByRole('button', {name: 'Refresh'}).parentElement).toBe(statusRow);
        expect(container.querySelector('.ydb-healthcheck__issue-action')).not.toBeInTheDocument();

        const issueTrigger = screen.getByRole('button', {name: /Disk is unavailable/});
        const issueSummary = container.querySelector<HTMLElement>(
            '.ydb-healthcheck__issue-summary',
        );
        expect(issueTrigger).toContainElement(issueSummary);
        expect(issueSummary).not.toHaveClass('ydb-healthcheck__issue-summary_with-assistant');
        expect(issueTrigger).toHaveAttribute('type', 'button');
        expect(issueTrigger).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(issueSummary as HTMLElement);
        expect(issueTrigger).toHaveAttribute('aria-expanded', 'true');
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
        jest.mocked(componentsRegistry.has).mockReturnValue(true);

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

    it('rejects a cluster request for database scope at the public type boundary', () => {
        const clusterRequest = {clusterName: 'production-cluster'};
        // @ts-expect-error database scope requires a database request
        const invalidTarget: HealthcheckAssistantTarget = {
            scope: 'database',
            request: clusterRequest,
        };

        expect(invalidTarget.request).toBe(clusterRequest);
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

    it('groups Status and Diagnostics separately from Refresh for a successful issue snapshot', () => {
        renderHealthcheck({database: '/Root/database'});

        const status = screen.getByTestId('healthcheck-status');
        const diagnostics = screen.getByTestId('diagnostics-action');
        const refresh = screen.getByRole('button', {name: 'Refresh'});
        const statusAndDiagnostics = status.parentElement;

        expect(statusAndDiagnostics).toContainElement(diagnostics);
        expect(statusAndDiagnostics).not.toContainElement(refresh);
        expect(statusAndDiagnostics?.parentElement).toContainElement(refresh);
    });

    it('keeps the assistant issue controls in direct DOM order', () => {
        const {container} = renderHealthcheck({database: '/Root/database'});

        const issueSummary = container.querySelector<HTMLElement>(
            '.ydb-healthcheck__issue-summary',
        );
        const fixAction = screen.getByRole('button', {name: 'Fix'});
        const children = Array.from(issueSummary?.children ?? []);

        expect(issueSummary).toHaveClass('ydb-healthcheck__issue-summary_with-assistant');
        expect(children).toHaveLength(4);
        expect(children[0]).toHaveClass('ydb-healthcheck__issue-message');
        expect(children[0]).toContainElement(
            container.querySelector('.ydb-healthcheck__issue-status'),
        );
        expect(children[1]).toContainElement(fixAction);
        expect(children[2]).toHaveClass('ydb-healthcheck__issue-divider');
        expect(children[3]).toHaveClass('ydb-healthcheck__issue-chevron');
    });

    it('keeps Fix from toggling the assistant issue disclosure', () => {
        renderHealthcheck({database: '/Root/database'});

        const chevron = screen.getByRole('button', {name: 'Expand issue details'});
        const fixAction = screen.getByRole('button', {name: 'Fix'});

        expect(chevron).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(fixAction);
        expect(chevron).toHaveAttribute('aria-expanded', 'false');
    });

    it.each([
        {name: 'row', selector: '.ydb-healthcheck__issue-summary'},
        {name: 'message', selector: '.ydb-healthcheck__issue-message'},
        {name: 'divider', selector: '.ydb-healthcheck__issue-divider'},
    ])('toggles the assistant issue disclosure once when clicking the $name', ({selector}) => {
        const {container} = renderHealthcheck({database: '/Root/database'});

        const chevron = screen.getByRole('button', {name: 'Expand issue details'});
        const target = container.querySelector<HTMLElement>(selector);

        expect(chevron).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(target as HTMLElement);
        expect(chevron).toHaveAttribute('aria-expanded', 'true');
    });

    it('toggles the assistant issue disclosure once when clicking the chevron', () => {
        renderHealthcheck({database: '/Root/database'});

        const chevron = screen.getByRole('button', {name: 'Expand issue details'});

        fireEvent.click(chevron);
        expect(screen.getByRole('button', {name: 'Collapse issue details'})).toHaveAttribute(
            'aria-expanded',
            'true',
        );
    });
});
