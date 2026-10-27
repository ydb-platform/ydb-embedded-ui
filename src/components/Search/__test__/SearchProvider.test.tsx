import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider, StringParam, useQueryParams} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {Search} from '../Search';
import {SearchProvider} from '../SearchProvider';

const queryParams = {search: StringParam, group: StringParam};
const renderTable = jest.fn();

function Page({debounce}: {debounce?: number}) {
    const [{search, group}, setQuery] = useQueryParams(queryParams);
    const onChange = (value: string) => setQuery({search: value || undefined}, 'replaceIn');
    renderTable(search);
    return (
        <SearchProvider value={search ?? ''} onChange={onChange} queryParams={queryParams}>
            <Search
                key={group ?? ''}
                value={search ?? ''}
                onChange={onChange}
                debounce={debounce}
                tableFilter
            />
        </SearchProvider>
    );
}

function setup(debounce?: number) {
    const history = createMemoryHistory({
        initialIndex: 1,
        initialEntries: ['/list?search=a&entity=one', '/list?search=a&entity=two'],
    });
    const renderPage = () => (
        <Router history={history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <Page debounce={debounce} />
            </QueryParamProvider>
        </Router>
    );
    const view = render(renderPage());
    return {
        history,
        ...view,
        input: screen.getByRole('textbox'),
        refresh: () => view.rerender(renderPage()),
    };
}

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

it('keeps typing local, preserves focus during data refresh and updates the URL once', async () => {
    const {history, input, refresh} = setup();
    const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});
    const url = history.location;
    renderTable.mockClear();
    await user.type(input, 'bc');
    expect(input).toHaveValue('abc');
    expect(renderTable).not.toHaveBeenCalled();
    expect(history.location).toBe(url);
    refresh();
    expect(input).toHaveValue('abc');
    expect(input).toHaveFocus();
    act(() => jest.advanceTimersByTime(199));
    expect(history.location).toBe(url);
    act(() => jest.advanceTimersByTime(1));
    expect(history.location.search).toBe('?search=abc&entity=two');
    expect(history.length).toBe(2);
    expect(renderTable).toHaveBeenLastCalledWith('abc');
    expect(input).toHaveFocus();
});

it('preserves a draft across a grouping remount without restarting the delay', () => {
    const {history, input} = setup();
    fireEvent.change(input, {target: {value: 'abc'}});
    act(() => jest.advanceTimersByTime(150));
    act(() => history.replace('/list?search=a&entity=two&group=host'));
    expect(screen.getByRole('textbox')).not.toBe(input);
    expect(screen.getByRole('textbox')).toHaveValue('abc');
    act(() => jest.advanceTimersByTime(50));
    expect(history.location.search).toBe('?search=abc&entity=two&group=host');
});

it.each(['back', 'forward', 'push', 'replace', 'unknown-context'] as const)(
    'cancels an old write before React commits navigation (%s) with the same search',
    (navigation) => {
        const {history, input} = setup();
        if (navigation === 'forward') {
            act(() => history.goBack());
        }
        fireEvent.change(input, {target: {value: 'pending'}});
        let destination = history.location;
        act(() => {
            if (navigation === 'back') {
                history.goBack();
            } else if (navigation === 'forward') {
                history.goForward();
            } else if (navigation === 'unknown-context') {
                history.replace('/list?search=a&entity=two&newContext=three');
            } else {
                history[navigation]('/list?search=a&entity=three');
            }
            destination = history.location;
            jest.advanceTimersByTime(200);
        });
        expect(input).toHaveValue('a');
        expect(history.location).toBe(destination);
        fireEvent.change(input, {target: {value: 'new'}});
        act(() => jest.advanceTimersByTime(200));
        expect(new URLSearchParams(history.location.search).get('search')).toBe('new');
    },
);

it('accepts an external clear and cancels the pending edit', () => {
    const {history, input} = setup();
    fireEvent.change(input, {target: {value: 'pending'}});
    act(() => history.replace('/list?entity=two'));
    expect(input).toHaveValue('');
    act(() => jest.advanceTimersByTime(200));
    expect(history.location.search).toBe('?entity=two');
});

it('preserves the explicit zero-debounce contract inside a provider', () => {
    const {history, input} = setup(0);
    fireEvent.change(input, {target: {value: 'abc'}});
    expect(history.location.search).toBe('?search=abc&entity=two');
});
