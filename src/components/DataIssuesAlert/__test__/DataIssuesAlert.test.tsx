import {render, screen} from '@testing-library/react';

import {DataIssuesAlert} from '../DataIssuesAlert';
import {DataIssuesIndicator} from '../DataIssuesIndicator';

describe('DataIssuesAlert', () => {
    test('Should render nothing without issues', () => {
        const {container} = render(<DataIssuesAlert issues={[]} problems={['bsc-timeout']} />);

        expect(container).toBeEmptyDOMElement();
    });

    test('Should explain every issue and list the raw problem codes', () => {
        render(
            <DataIssuesAlert
                issues={['list-incomplete', 'sort-not-applied']}
                problems={['bsc-timeout', 'wb-incomplete-groups']}
            />,
        );

        expect(
            screen.getByText('The list may be incomplete: some data sources did not respond.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Sorting was not applied: rows are shown in arbitrary order.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Problems reported by the server: bsc-timeout, wb-incomplete-groups'),
        ).toBeInTheDocument();
    });

    test('Should omit the codes line when only flags were raised', () => {
        render(<DataIssuesAlert issues={['group-not-applied']} />);

        expect(screen.getByText('Grouping was not applied.')).toBeInTheDocument();
        expect(screen.queryByText(/Problems reported by the server/)).not.toBeInTheDocument();
    });
});

describe('DataIssuesIndicator', () => {
    test('Should render nothing without issues', () => {
        const {container} = render(<DataIssuesIndicator issues={[]} problems={['bsc-timeout']} />);

        expect(container).toBeEmptyDOMElement();
    });

    test('Should render a focusable control that names the problem', () => {
        render(<DataIssuesIndicator issues={['list-incomplete']} problems={['bsc-timeout']} />);

        expect(
            screen.getByRole('button', {name: 'Data may be incomplete or inaccurate'}),
        ).toBeInTheDocument();
    });
});
