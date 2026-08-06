import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {HelpMarkWithDocs} from '../HelpMarkWithDocs';

function renderHelpMark(helpMark: React.ReactElement) {
    return render(<ThemeProvider theme="light">{helpMark}</ThemeProvider>);
}

describe('HelpMarkWithDocs', () => {
    test('renders help content without a documentation link', async () => {
        const user = userEvent.setup();
        renderHelpMark(<HelpMarkWithDocs>Allocation units help</HelpMarkWithDocs>);

        await user.hover(screen.getByRole('button'));

        expect(await screen.findByText('Allocation units help')).toBeVisible();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('renders a secure external documentation link', async () => {
        const user = userEvent.setup();
        renderHelpMark(
            <HelpMarkWithDocs docsLink="https://ydb.tech/docs/concepts/glossary#channel">
                Allocation units help
            </HelpMarkWithDocs>,
        );

        await user.hover(screen.getByRole('button'));

        const link = await screen.findByRole('link', {name: /Learn more/});
        expect(link).toHaveAttribute('href', 'https://ydb.tech/docs/concepts/glossary#channel');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('allows overriding the documentation link title', async () => {
        const user = userEvent.setup();
        renderHelpMark(
            <HelpMarkWithDocs
                docsLink="https://ydb.tech/docs/concepts/glossary#channel"
                docsLinkTitle="Channel documentation"
            >
                Allocation units help
            </HelpMarkWithDocs>,
        );

        await user.hover(screen.getByRole('button'));

        expect(await screen.findByRole('link', {name: /Channel documentation/})).toBeVisible();
    });
});
