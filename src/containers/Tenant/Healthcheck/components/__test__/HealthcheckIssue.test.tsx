import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import type {IssuesTree} from '../../../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult, StatusFlag} from '../../../../../types/api/healthcheck';
import {HealthcheckContext} from '../../HealthcheckContext';
import type {HealthcheckContextValue} from '../../HealthcheckContext';
import {HealthcheckIssue} from '../HealthcheckIssue';

const issue = {
    id: 'vdisk-1',
    message: 'VDisk is not available',
    status: StatusFlag.RED,
    categoryForUI: 'storage',
} satisfies IssuesTree;

function renderIssue(assistant?: HealthcheckContextValue['assistant'], value: IssuesTree = issue) {
    return render(
        <MemoryRouter>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <HealthcheckContext.Provider value={{database: '/Root/db', assistant}}>
                    <HealthcheckIssue issue={value} />
                </HealthcheckContext.Provider>
            </QueryParamProvider>
        </MemoryRouter>,
    );
}

test('keeps the compact status before the title and the full row as the disclosure trigger', () => {
    const {container} = renderIssue();
    const status = screen.getByRole('img', {name: 'Critical'});
    const title = screen.getAllByText(issue.message)[0];
    expect(status.compareDocumentPosition(title)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    const trigger = screen.getByRole('button', {name: /VDisk is not available/});
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('button button')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Details')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('keeps Fix independent from disclosure and passes the original issue and target', () => {
    const fix = jest.fn();
    const target = {
        scope: 'database' as const,
        request: {database: '/Root/db', clusterName: 'test'},
    };
    const snapshot = {selfCheckResult: SelfCheckResult.EMERGENCY, issues: [issue]};
    const renderAction = jest.fn((props) => (
        <button type="button" onClick={() => fix(props)}>
            Fix
        </button>
    ));
    const {container} = renderIssue({target, snapshot, renderAction});

    expect(screen.getByRole('img', {name: 'Critical'})).toBeInTheDocument();
    const disclosure = screen.getByRole('button', {name: /Expand/});
    fireEvent.click(screen.getByRole('button', {name: 'Fix'}));
    expect(fix).toHaveBeenCalledTimes(1);
    expect(fix).toHaveBeenCalledWith({action: 'fix', issue, target, snapshot});
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('button button')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByText(issue.message)[0]);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', {name: 'Fix'}));
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Details')).toBeInTheDocument();
});

test('renders a title without a status placeholder when status is absent', () => {
    const {container} = renderIssue(undefined, {...issue, status: undefined});
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('.ydb-healthcheck__issue-status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: issue.message})).toBeInTheDocument();
});
