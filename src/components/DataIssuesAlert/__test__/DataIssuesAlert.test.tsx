import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {DataIssueKind} from '../../../utils/dataIssues/classify';
import {DATA_ISSUES_CODES_QA, DATA_ISSUES_ITEM_QA, DataIssuesAlert} from '../DataIssuesAlert';
import {DataIssuesIndicator} from '../DataIssuesIndicator';

/** The kinds of the listed issues; the popover of the indicator is rendered in a portal */
function getIssues() {
    return Array.from(document.querySelectorAll(`[data-qa="${DATA_ISSUES_ITEM_QA}"]`)).map((item) =>
        item.getAttribute('data-issue'),
    );
}

function getCodes() {
    return document.querySelector(`[data-qa="${DATA_ISSUES_CODES_QA}"]`);
}

describe('DataIssuesAlert', () => {
    test('Should render nothing without issues', () => {
        const {container} = render(<DataIssuesAlert issues={[]} problems={['bsc-timeout']} />);

        expect(container).toBeEmptyDOMElement();
    });

    test('Should list every issue and the raw problem codes', () => {
        render(
            <DataIssuesAlert
                issues={['list-incomplete', 'sort-not-applied']}
                problems={['bsc-timeout', 'wb-incomplete-groups']}
            />,
        );

        expect(getIssues()).toEqual(['list-incomplete', 'sort-not-applied']);
        expect(getCodes()).toHaveTextContent('bsc-timeout, wb-incomplete-groups');
    });

    test('Should omit the codes line when only flags were raised', () => {
        render(<DataIssuesAlert issues={['group-not-applied']} />);

        expect(getIssues()).toEqual(['group-not-applied']);
        expect(getCodes()).not.toBeInTheDocument();
    });
});

describe('DataIssuesIndicator', () => {
    test('Should render nothing without issues', () => {
        const {container} = render(<DataIssuesIndicator issues={[]} problems={['bsc-timeout']} />);

        expect(container).toBeEmptyDOMElement();
    });

    test('Should add what the data is to its accessible name only', () => {
        render(<DataIssuesIndicator issues={['list-incomplete']} subject="Top nodes by load" />);

        const indicator = screen.getByRole('button');
        expect(indicator).toHaveAccessibleName(/Top nodes by load/);
        // the visible text stays short
        expect(indicator).not.toHaveTextContent('Top nodes by load');
    });

    // The popover is rendered in a portal, which needs the theme
    function renderInteractive(issues: DataIssueKind[]) {
        return render(
            <ThemeProvider theme="light">
                <DataIssuesIndicator compact issues={issues} problems={['bsc-timeout']} />
            </ThemeProvider>,
        );
    }

    test('Should list the issues and the codes on hover', async () => {
        renderInteractive(['list-incomplete']);

        expect(getIssues()).toEqual([]);

        await userEvent.hover(screen.getByRole('button'));

        await waitFor(() => expect(getIssues()).toEqual(['list-incomplete']));
        expect(getCodes()).toHaveTextContent('bsc-timeout');
    });

    test('Should open the details from the keyboard', async () => {
        const user = userEvent.setup();
        renderInteractive(['sort-not-applied']);
        const indicator = screen.getByRole('button');

        await user.tab();
        expect(indicator).toHaveFocus();
        await user.keyboard('{Enter}');

        await waitFor(() => expect(getIssues()).toEqual(['sort-not-applied']));
    });
});
