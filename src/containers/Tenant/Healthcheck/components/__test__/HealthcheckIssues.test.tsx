import {render, screen} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {ComponentsProvider} from '../../../../../components/ComponentsProvider/ComponentsProvider';
import {componentsRegistry} from '../../../../../components/ComponentsProvider/componentsRegistry';
import type {IssuesTree} from '../../../../../store/reducers/healthcheckInfo/types';
import {Issues} from '../HealthcheckIssues';

jest.mock('../../../useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({
        issuesFilter: undefined,
        view: undefined,
    }),
}));

describe('HealthcheckIssues', () => {
    test('renders the first category with issues before the view query parameter is set', () => {
        const history = createMemoryHistory();
        const issues: IssuesTree[] = [
            {
                id: 'compute-issue',
                categoryForUI: 'compute',
                message: 'Compute issue',
            },
        ];

        render(
            <ComponentsProvider registry={componentsRegistry}>
                <Router history={history}>
                    <QueryParamProvider adapter={ReactRouter5Adapter}>
                        <Issues issues={issues} />
                    </QueryParamProvider>
                </Router>
            </ComponentsProvider>,
        );

        expect(screen.getByRole('button', {name: /Compute issue/})).toBeVisible();
        expect(screen.queryByText('No issues')).not.toBeInTheDocument();
    });
});
