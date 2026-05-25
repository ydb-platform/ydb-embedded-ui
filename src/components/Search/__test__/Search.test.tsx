import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {Search} from '../Search';

describe('Search', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('preserves leading and trailing whitespace in the onChange value', async () => {
        const onChange = jest.fn();
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});

        render(<Search onChange={onChange} value="" />);

        const input = screen.getByRole('textbox');
        await user.type(input, '  hello  ');

        jest.runAllTimers();

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0]).toBe('  hello  ');
    });

    it('preserves internal spaces in the onChange value', async () => {
        const onChange = jest.fn();
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});

        render(<Search onChange={onChange} value="" />);

        const input = screen.getByRole('textbox');
        await user.type(input, 'hello world');

        jest.runAllTimers();

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0]).toBe('hello world');
    });
    it('preserves whitespace-only input', async () => {
        const onChange = jest.fn();
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});

        render(<Search onChange={onChange} value="" />);

        const input = screen.getByRole('textbox');
        await user.type(input, '   ');

        jest.runAllTimers();

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0]).toBe('   ');
    });
});
