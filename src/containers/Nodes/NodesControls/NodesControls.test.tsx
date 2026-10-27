import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {useNodesPageQueryParams} from '../useNodesPageQueryParams';

import {NodesControls} from './NodesControls';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useViewerNodesHandlerHasGroupingBySystemState: () => true,
    useViewerNodesHandlerHasNetworkStats: () => false,
    useViewerNodesAliveFilterAvailable: () => false,
    useCapabilitiesLoaded: () => true,
}));

jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: () => true,
}));

function NodesSearch() {
    const {searchValue} = useNodesPageQueryParams([], false);
    return (
        <React.Fragment>
            <NodesControls
                groupByParams={[]}
                withGroupBySelect
                entitiesCountCurrent={0}
                entitiesLoading={false}
            />
            <output aria-label="Table filter">{searchValue}</output>
        </React.Fragment>
    );
}

describe('Nodes search URL integration', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function setup() {
        const history = createMemoryHistory({
            initialIndex: 1,
            initialEntries: [
                '/cluster/nodes?search=previous',
                '/cluster/nodes?search=a&database=%2Flocal&clusterName=test&backend=proxy',
            ],
        });
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});
        render(
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <NodesSearch />
                </QueryParamProvider>
            </Router>,
        );
        return {history, user, input: screen.getByRole('textbox')};
    }

    it('updates text immediately and debounces the URL and table filter together', async () => {
        const {history, user, input} = setup();
        await user.type(input, 'bc');

        expect(input).toHaveValue('abc');
        expect(new URLSearchParams(history.location.search).get('search')).toBe('a');
        expect(screen.getByRole('status')).toHaveTextContent(/^a$/);

        act(() => jest.advanceTimersByTime(200));
        expect(new URLSearchParams(history.location.search).get('search')).toBe('abc');
        expect(new URLSearchParams(history.location.search).get('database')).toBe('/local');
        expect(new URLSearchParams(history.location.search).get('clusterName')).toBe('test');
        expect(new URLSearchParams(history.location.search).get('backend')).toBe('proxy');
        expect(history.length).toBe(2);
        expect(screen.getByRole('status')).toHaveTextContent(/^abc$/);
        expect(input).toHaveValue('abc');
        expect(input).toHaveFocus();
    });

    it('keeps the next character when the previous filter update is still pending', async () => {
        const {user, input} = setup();
        await user.type(input, 'b');

        act(() => {
            jest.advanceTimersByTime(200);
            // Type before React commits the previous debounced update.
            fireEvent.change(input, {target: {value: 'abc'}});
        });

        expect(input).toHaveValue('abc');
        expect(input).toHaveFocus();

        act(() => jest.advanceTimersByTime(200));
        expect(input).toHaveValue('abc');
        expect(screen.getByRole('status')).toHaveTextContent(/^abc$/);
    });

    it('accepts Back, Forward and external clearing while a filter is pending', async () => {
        const {history, user, input} = setup();
        await user.type(input, 'b');
        act(() => history.goBack());
        expect(input).toHaveValue('previous');
        act(() => jest.advanceTimersByTime(200));
        expect(input).toHaveValue('previous');
        expect(screen.getByRole('status')).toHaveTextContent(/^previous$/);

        act(() => history.goForward());
        expect(input).toHaveValue('a');
        await user.type(input, 'c');
        act(() => history.replace('/cluster/nodes'));
        expect(input).toHaveValue('');
        act(() => jest.runAllTimers());
        expect(input).toHaveValue('');
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
        expect(history.location.search).toBe('');
    });
});
