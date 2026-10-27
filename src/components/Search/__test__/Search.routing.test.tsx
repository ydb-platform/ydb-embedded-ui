import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider, StringParam, useQueryParam} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {Search} from '../Search';

function SearchWithUrl({param}: {param: string}) {
    const [value, setValue] = useQueryParam(param, StringParam);
    return (
        <Search value={value ?? ''} onChange={(next) => setValue(next || undefined, 'replaceIn')} />
    );
}

describe.each(['nodesSearch', 'groupsSearch'])('Search with URL parameter %s', (param) => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function setup() {
        const history = createMemoryHistory({
            initialIndex: 1,
            initialEntries: [
                `/cluster/storage?${param}=previous`,
                `/cluster/storage?${param}=a&database=%2Flocal&clusterName=test&backend=proxy`,
            ],
        });
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});
        const view = render(
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <SearchWithUrl param={param} />
                </QueryParamProvider>
            </Router>,
        );
        return {history, user, ...view, input: screen.getByRole('textbox')};
    }

    it('preserves the next edit and focus while the previous URL update commits', async () => {
        const {history, user, input} = setup();
        await user.type(input, 'b');

        act(() => {
            jest.advanceTimersByTime(200);
            fireEvent.change(input, {target: {value: 'abc'}});
        });

        expect(input).toHaveValue('abc');
        expect(input).toHaveFocus();
        expect(new URLSearchParams(history.location.search).get(param)).toBe('ab');
        act(() => jest.advanceTimersByTime(200));
        expect(input).toHaveValue('abc');
        const params = new URLSearchParams(history.location.search);
        expect(params.get(param)).toBe('abc');
        expect(params.get('database')).toBe('/local');
        expect(params.get('clusterName')).toBe('test');
        expect(params.get('backend')).toBe('proxy');
        expect(history.length).toBe(2);
    });

    it('does not restore pending input after Back, Forward or external clearing', async () => {
        const {history, user, input} = setup();
        await user.type(input, 'b');
        act(() => history.goBack());
        expect(input).toHaveValue('previous');
        act(() => jest.runAllTimers());
        expect(new URLSearchParams(history.location.search).get(param)).toBe('previous');

        act(() => history.goForward());
        expect(input).toHaveValue('a');
        await user.type(input, 'c');
        act(() => history.replace('/cluster/storage'));
        expect(input).toHaveValue('');
        act(() => jest.runAllTimers());
        expect(input).toHaveValue('');
        expect(history.location.search).toBe('');
    });

    it('does not update the URL after leaving the search', async () => {
        const {history, user, input, unmount} = setup();
        await user.type(input, 'b');
        unmount();
        act(() => history.push('/cluster/databases'));
        act(() => jest.runAllTimers());
        expect(history.location.pathname).toBe('/cluster/databases');
        expect(history.location.search).toBe('');
    });
});
