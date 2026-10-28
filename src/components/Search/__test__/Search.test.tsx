import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider, StringParam, useQueryParam} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {Search} from '../Search';

function SearchWithQueryParam() {
    const [value, setValue] = useQueryParam('search', StringParam);
    return (
        <Search tableFilter value={value ?? ''} onChange={(next) => setValue(next, 'replaceIn')} />
    );
}

describe('Search', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('keeps newer input while the debounced URL update arrives', () => {
        const history = createMemoryHistory({initialEntries: ['/?search=a']});
        render(
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <SearchWithQueryParam />
                </QueryParamProvider>
            </Router>,
        );
        const input = screen.getByRole('textbox');

        fireEvent.change(input, {target: {value: 'ab'}});
        expect(input).toHaveValue('ab');
        expect(history.location.search).toBe('?search=a');
        act(() => {
            jest.advanceTimersByTime(200);
            fireEvent.change(input, {target: {value: 'abc'}});
        });
        expect(input).toHaveValue('abc');
        expect(history.location.search).toBe('?search=ab');
        act(() => jest.advanceTimersByTime(200));
        expect(input).toHaveValue('abc');
        expect(history.location.search).toBe('?search=abc');
    });

    it('calls onChange synchronously when debounce is zero', () => {
        const onChange = jest.fn();
        render(<Search debounce={0} value="" onChange={onChange} />);

        fireEvent.change(screen.getByRole('textbox'), {target: {value: 'query'}});

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('query');
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
