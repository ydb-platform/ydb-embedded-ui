import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {EditorButton} from '../EditorButton';

describe('EditorButton.ExplainAnalyze', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('warns that the query is executed and its results are ignored', async () => {
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});

        render(
            <ThemeProvider theme="light">
                <EditorButton.ExplainAnalyze />
            </ThemeProvider>,
        );

        await user.hover(screen.getByRole('button', {name: 'Explain Analyze'}));

        expect(screen.getByText('The query will be executed')).toBeVisible();
        expect(
            screen.getByText(
                'Any changes will be applied to the database. Query results are ignored.',
            ),
        ).toBeVisible();
    });
});
