import React from 'react';

import {act, renderHook} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {
    useCapabilitiesLoaded,
    useViewerNodesAliveFilterAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {useHideUnavailableNodes} from '../useHideUnavailableNodes';

jest.mock('../../../store/reducers/capabilities/hooks');

const mockAvailable = jest.mocked(useViewerNodesAliveFilterAvailable);
const mockLoaded = jest.mocked(useCapabilitiesLoaded);

function setup(query = '') {
    const history = createMemoryHistory({initialEntries: [`/cluster/nodes?${query}`]});
    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Router history={history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>{children}</QueryParamProvider>
        </Router>
    );
    return {...renderHook(useHideUnavailableNodes, {wrapper}), history};
}

beforeEach(() => {
    mockAvailable.mockReturnValue(true);
    mockLoaded.mockReturnValue(true);
});

it.each(['', 'hideUnavailable=0', 'hideUnavailable=invalid', 'hideUnavailable'])(
    'defaults to showing unavailable nodes for %s',
    (query) => {
        expect(setup(query).result.current.hideUnavailable).toBe(false);
    },
);

it('restores the filter from a shared URL', () => {
    expect(setup('hideUnavailable=1').result.current.hideUnavailable).toBe(true);
});

it('toggles without clearing filters or runtime identity', () => {
    const {result, history} = setup('search=host&database=%2Flocal&clusterName=test&backend=proxy');
    act(() => result.current.handleHideUnavailableChange(true));
    expect(result.current.hideUnavailable).toBe(true);
    expect(new URLSearchParams(history.location.search).get('hideUnavailable')).toBe('1');
    act(() => result.current.handleHideUnavailableChange(false));
    expect(result.current.hideUnavailable).toBe(false);
    expect(new URLSearchParams(history.location.search)).toEqual(
        new URLSearchParams('search=host&database=%2Flocal&clusterName=test&backend=proxy'),
    );
});

it('waits for capabilities before removing an unsupported saved selection', () => {
    mockAvailable.mockReturnValue(false);
    mockLoaded.mockReturnValue(false);
    const {result, history, rerender} = setup('hideUnavailable=1&search=host');
    expect(result.current.hideUnavailable).toBe(false);
    expect(new URLSearchParams(history.location.search).get('hideUnavailable')).toBe('1');
    mockLoaded.mockReturnValue(true);
    rerender();
    expect(history.location.search).toBe('?search=host');
});

it('revalidates the saved selection when capabilities change', () => {
    const {result, rerender, history} = setup('hideUnavailable=1');
    expect(result.current.hideUnavailable).toBe(true);
    mockAvailable.mockReturnValue(false);
    rerender();
    expect(result.current.hideUnavailable).toBe(false);
    expect(new URLSearchParams(history.location.search).has('hideUnavailable')).toBe(false);
});
