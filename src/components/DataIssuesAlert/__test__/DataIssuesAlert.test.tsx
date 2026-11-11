import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {DataIssueKind} from '../../../utils/dataIssues/classify';
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

    test('Should use a shorter label where the width is shared with other controls', () => {
        render(
            <DataIssuesIndicator compact issues={['list-incomplete']} problems={['bsc-timeout']} />,
        );

        expect(screen.getByRole('button', {name: 'Data issues'})).toBeInTheDocument();
    });

    // The popover is rendered in a portal, which needs the theme
    function renderInteractive(issues: DataIssueKind[]) {
        return render(
            <ThemeProvider theme="light">
                <DataIssuesIndicator compact issues={issues} problems={['bsc-timeout']} />
            </ThemeProvider>,
        );
    }

    test('Should explain the issues and list the codes on hover', async () => {
        renderInteractive(['list-incomplete']);

        expect(screen.queryByText(/The list may be incomplete/)).not.toBeInTheDocument();

        await userEvent.hover(screen.getByRole('button', {name: 'Data issues'}));

        expect(await screen.findByText(/The list may be incomplete/)).toBeInTheDocument();
        expect(
            screen.getByText('Problems reported by the server: bsc-timeout'),
        ).toBeInTheDocument();
    });

    test('Should open the details from the keyboard', async () => {
        const user = userEvent.setup();
        renderInteractive(['sort-not-applied']);

        await user.tab();
        expect(screen.getByRole('button', {name: 'Data issues'})).toHaveFocus();
        await user.keyboard('{Enter}');

        expect(await screen.findByText(/Sorting was not applied/)).toBeInTheDocument();
    });
});
