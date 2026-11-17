import React from 'react';

import {Dialog, ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {SuggestInputItem} from '../SuggestInput';
import {SuggestInput} from '../SuggestInput';

const ITEMS = ['alpha', 'alpine', 'beta'];

function TestInput({
    onSubmit,
    openOnFocus,
}: {
    onSubmit?: (value: string) => void;
    openOnFocus?: boolean;
}) {
    const [value, setValue] = React.useState('');
    const suggestions: SuggestInputItem[] = ITEMS.filter((item) => item.startsWith(value)).map(
        (item) => ({value: item}),
    );

    return (
        <ThemeProvider theme="light">
            <button type="button">before</button>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit?.(value);
                }}
            >
                <SuggestInput
                    value={value}
                    onUpdate={setValue}
                    suggestions={suggestions}
                    openOnFocus={openOnFocus}
                />
            </form>
            <button type="button">after</button>
        </ThemeProvider>
    );
}

describe('SuggestInput', () => {
    beforeAll(() => {
        // Dialog needs matchMedia, which jsdom doesn't implement
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        });
    });

    it('shows suggestions for the typed value', async () => {
        const user = userEvent.setup();
        render(<TestInput />);

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

        await user.type(screen.getByRole('combobox'), 'al');

        expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
            'alpha',
            'alpine',
        ]);
    });

    it('selects a suggestion with a click', async () => {
        const user = userEvent.setup();
        render(<TestInput />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'b');
        await user.click(screen.getByRole('option', {name: 'beta'}));

        expect(input).toHaveValue('beta');
        expect(input).toHaveFocus();
    });

    it('selects a suggestion with the keyboard without submitting the form', async () => {
        const user = userEvent.setup();
        const onSubmit = jest.fn();
        render(<TestInput onSubmit={onSubmit} />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'al');
        await user.keyboard('{ArrowDown}{Enter}');

        expect(input).toHaveValue('alpine');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not show suggestions on focus until the user asks for them', async () => {
        const user = userEvent.setup();
        render(<TestInput />);
        const input = screen.getByRole('combobox');

        await user.click(input);
        expect(screen.queryAllByRole('option')).toHaveLength(0);

        await user.keyboard('{ArrowDown}');
        expect(screen.getAllByRole('option')).toHaveLength(3);
        expect(screen.getByRole('option', {name: 'alpha'})).toHaveAttribute(
            'aria-selected',
            'true',
        );
    });

    it('shows suggestions on focus with openOnFocus', async () => {
        const user = userEvent.setup();
        render(<TestInput openOnFocus />);

        await user.click(screen.getByRole('combobox'));

        expect(screen.getAllByRole('option')).toHaveLength(3);
        expect(screen.getByRole('option', {name: 'alpha'})).toHaveAttribute(
            'aria-selected',
            'true',
        );

        await user.keyboard('{Enter}');
        expect(screen.getByRole('combobox')).toHaveValue('alpha');
    });

    it('highlights the first match, so Enter selects it instead of submitting', async () => {
        const user = userEvent.setup();
        const onSubmit = jest.fn();
        render(<TestInput onSubmit={onSubmit} />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'b');
        expect(screen.getByRole('option', {name: 'beta'})).toHaveAttribute('aria-selected', 'true');

        await user.keyboard('{Enter}');
        expect(input).toHaveValue('beta');
        expect(onSubmit).not.toHaveBeenCalled();

        // The highlighted item is already the value: the next Enter submits the form
        await user.keyboard('{Enter}');
        expect(onSubmit).toHaveBeenCalledWith('beta');
    });

    it('selects the highlighted suggestion with Tab and keeps focus in the input', async () => {
        const user = userEvent.setup();
        render(<TestInput />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'b');
        await user.tab();

        expect(input).toHaveValue('beta');
        expect(input).toHaveFocus();
    });

    it('moves focus backward with Shift+Tab instead of selecting a suggestion', async () => {
        const user = userEvent.setup();
        render(<TestInput />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'b');
        expect(screen.getByRole('option', {name: 'beta'})).toHaveAttribute('aria-selected', 'true');

        await user.tab({shift: true});

        expect(input).toHaveValue('b');
        expect(screen.getByRole('button', {name: 'before'})).toHaveFocus();
    });

    it('does not select a suggestion while text is being composed', async () => {
        const user = userEvent.setup();
        const onSubmit = jest.fn();
        render(<TestInput onSubmit={onSubmit} />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'b');
        // Enter that confirms the text in an input method editor
        fireEvent.keyDown(input, {key: 'Enter', isComposing: true});

        expect(input).toHaveValue('b');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits the typed value after the list is closed with Escape', async () => {
        const user = userEvent.setup();
        const onSubmit = jest.fn();
        render(<TestInput onSubmit={onSubmit} />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'al');
        await user.keyboard('{Escape}');
        expect(input).toHaveAttribute('aria-expanded', 'false');

        await user.keyboard('{Enter}');
        expect(input).toHaveValue('al');
        expect(onSubmit).toHaveBeenCalledWith('al');
    });

    it('closes only the list with Escape inside Dialog', async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();

        function DialogWithInput() {
            const [value, setValue] = React.useState('');
            const inputRef = React.useRef<HTMLInputElement>(null);
            const suggestions = ITEMS.filter((item) => item.startsWith(value)).map((item) => ({
                value: item,
            }));
            return (
                <ThemeProvider theme="light">
                    <Dialog open onClose={onClose} initialFocus={inputRef}>
                        <Dialog.Body>
                            <SuggestInput
                                controlRef={inputRef}
                                value={value}
                                onUpdate={setValue}
                                suggestions={suggestions}
                            />
                        </Dialog.Body>
                    </Dialog>
                </ThemeProvider>
            );
        }

        render(<DialogWithInput />);
        const input = await screen.findByRole('combobox');
        // Dialog moves focus to the input when it opens
        await waitFor(() => expect(input).toHaveFocus());

        await user.keyboard('al');
        expect(input).toHaveValue('al');
        expect(screen.getAllByRole('option')).toHaveLength(2);

        await user.keyboard('{Escape}');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).toHaveValue('al');
        expect(onClose).not.toHaveBeenCalled();

        // The list is closed, so the next Escape goes to the dialog
        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });

    it('keeps a custom value and submits it', async () => {
        const user = userEvent.setup();
        const onSubmit = jest.fn();
        render(<TestInput onSubmit={onSubmit} />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'al');
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        await user.type(input, 'most');
        expect(screen.queryAllByRole('option')).toHaveLength(0);
        expect(input).toHaveAttribute('aria-expanded', 'false');

        fireEvent.submit(input);
        expect(onSubmit).toHaveBeenCalledWith('almost');
    });
});
