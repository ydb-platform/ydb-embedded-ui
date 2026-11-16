import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen} from '@testing-library/react';
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
