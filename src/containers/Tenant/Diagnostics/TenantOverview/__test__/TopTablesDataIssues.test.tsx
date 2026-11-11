import {render, screen} from '@testing-library/react';

import type {ResponseDataQuality} from '../../../../../utils/dataIssues/types';
import {TopGroupsDataIssues, TopNodesDataIssues} from '../TopTablesDataIssues';

const indicator = {name: 'Data may be incomplete or inaccurate'};

function response(extra: Partial<ResponseDataQuality> = {}) {
    return {
        dataQuality: {problems: [], needFilter: false, needSort: false, needGroup: false, ...extra},
    };
}

describe('TopNodesDataIssues', () => {
    test('renders nothing until the response is loaded or when it is clean', () => {
        const {container, rerender} = render(<TopNodesDataIssues />);
        expect(container).toBeEmptyDOMElement();

        rerender(<TopNodesDataIssues response={response()} />);
        expect(container).toBeEmptyDOMElement();
    });

    test.each([
        [{problems: ['hive-timeout']}],
        [{problems: ['wb-incomplete']}],
        [{needSort: true}],
    ])('shows the indicator for %j', (quality) => {
        render(<TopNodesDataIssues response={response(quality)} />);

        expect(screen.getByRole('button', indicator)).toBeInTheDocument();
    });
});

describe('TopGroupsDataIssues', () => {
    test('renders nothing for a clean response', () => {
        const {container} = render(<TopGroupsDataIssues response={response()} />);

        expect(container).toBeEmptyDOMElement();
    });

    test.each([[{problems: ['bsc-timeout']}], [{needSort: true}]])(
        'shows the indicator for %j',
        (quality) => {
            render(<TopGroupsDataIssues response={response(quality)} />);

            expect(screen.getByRole('button', indicator)).toBeInTheDocument();
        },
    );
});
