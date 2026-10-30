import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen} from '@testing-library/react';

import {QueryDataNotEnabled} from '../components/QueryDataNotEnabled/QueryDataNotEnabled';

test.each([
    ['plan', 'Query plan not enabled', 'Select Full mode'],
    ['stats', 'Statistics not enabled', 'Select Basic or Full mode'],
] as const)(
    'renders the %s explanation and existing settings action',
    (kind, title, description) => {
        const onOpenSettings = jest.fn();
        render(
            <ThemeProvider theme="light">
                <QueryDataNotEnabled kind={kind} onOpenSettings={onOpenSettings} />
            </ThemeProvider>,
        );
        expect(screen.getByText(title)).toBeVisible();
        expect(screen.getByText(new RegExp(description))).toBeVisible();
        fireEvent.click(screen.getByRole('button', {name: 'Open query settings'}));
        expect(onOpenSettings).toHaveBeenCalledTimes(1);
    },
);
