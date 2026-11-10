import {render, screen} from '@testing-library/react';

import {TopGroupsDataIssues, TopNodesDataIssues} from '../TopTablesDataIssues';

const indicator = {name: 'Data may be incomplete or inaccurate'};

describe('TopNodesDataIssues', () => {
    test('renders nothing until the response is loaded or when it is clean', () => {
        const {container, rerender} = render(<TopNodesDataIssues />);
        expect(container).toBeEmptyDOMElement();

        rerender(<TopNodesDataIssues response={{problems: [], needSort: false}} />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders nothing for a response of a backend that does not report problems', () => {
        const {container} = render(<TopNodesDataIssues response={{}} />);

        expect(container).toBeEmptyDOMElement();
    });

    test.each([
        [{problems: ['hive-timeout']}],
        [{problems: ['wb-incomplete']}],
        [{needSort: true}],
    ])('shows the indicator for %j', (response) => {
        render(<TopNodesDataIssues response={response} />);

        expect(screen.getByRole('button', indicator)).toBeInTheDocument();
    });
});

describe('TopGroupsDataIssues', () => {
    test('renders nothing for a clean response', () => {
        const {container} = render(<TopGroupsDataIssues response={{problems: []}} />);

        expect(container).toBeEmptyDOMElement();
    });

    test.each([[{problems: ['bsc-timeout']}], [{needSort: true}]])(
        'shows the indicator for %j',
        (response) => {
            render(<TopGroupsDataIssues response={response} />);

            expect(screen.getByRole('button', indicator)).toBeInTheDocument();
        },
    );
});
