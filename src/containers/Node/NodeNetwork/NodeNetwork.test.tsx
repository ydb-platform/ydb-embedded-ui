import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {NodeNetwork} from './NodeNetwork';
import {NodeNetworkTable} from './NodeNetworkTable';

jest.mock('./NodeNetworkTable', () => ({NodeNetworkTable: jest.fn(() => null)}));
jest.mock('./columns', () => ({getNodeNetworkColumns: () => []}));
jest.mock('../../../components/TableColumnSetup/TableColumnSetup', () => ({
    TableColumnSetup: () => null,
}));
jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useBridgeModeEnabled: () => false,
    useViewerNodesHandlerHasGroupingBySystemState: () => false,
}));
jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: () => true,
}));
jest.mock('../../../utils/hooks/useSelectedColumns', () => ({
    useSelectedColumns: () => ({columnsToShow: [], columnsToSelect: [], setColumns: jest.fn()}),
}));

const originalApi = window.api;
const getPath = jest.fn(() => '/first-backend');
const mockTable = jest.mocked(NodeNetworkTable);
beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    window.api = {viewer: {getPath}} as unknown as typeof window.api;
});
afterEach(() => {
    window.api = originalApi;
    jest.useRealTimers();
});

it('delays typing but resets immediately when the requested node or backend changes', () => {
    const history = createMemoryHistory({initialEntries: ['/node/one/network?search=a']});
    const renderPage = (nodeId: string) => (
        <Router history={history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <NodeNetwork
                    nodeId={nodeId}
                    scrollContainerRef={React.createRef<HTMLDivElement>()}
                />
            </QueryParamProvider>
        </Router>
    );
    const view = render(renderPage('one'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: 'abc'}});
    expect(new URLSearchParams(history.location.search).get('search')).toBe('abc');
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({searchValue: 'a'}), {});
    act(() => jest.advanceTimersByTime(200));
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({searchValue: 'abc'}), {});
    fireEvent.change(input, {target: {value: 'abcd'}});
    const url = history.location;
    view.rerender(renderPage('two'));
    expect(history.location).toBe(url);
    expect(screen.getByRole('textbox')).toBe(input);
    expect(mockTable).toHaveBeenLastCalledWith(
        expect.objectContaining({nodeId: 'two', searchValue: 'abcd'}),
        {},
    );
    fireEvent.change(input, {target: {value: 'abcde'}});
    getPath.mockReturnValue('/second-backend');
    view.rerender(renderPage('two'));
    expect(mockTable).toHaveBeenLastCalledWith(
        expect.objectContaining({nodeId: 'two', searchValue: 'abcde'}),
        {},
    );
});
