import {act, fireEvent, render, screen} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {TopicDataControls} from './TopicDataControls';

describe('Topic data offset input', () => {
    const originalResizeObserver = window.ResizeObserver;
    beforeAll(() => {
        window.ResizeObserver = jest.fn(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }));
    });
    afterAll(() => {
        window.ResizeObserver = originalResizeObserver;
    });
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function setup() {
        const history = createMemoryHistory({
            initialEntries: [
                '/tenant?topicDataFilter=OFFSET&selectedOffset=10&database=%2Flocal&clusterName=test&backend=proxy',
            ],
        });
        render(
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <TopicDataControls
                        partitionsLoading={false}
                        partitionsError={undefined}
                        scrollToOffset={jest.fn()}
                    />
                </QueryParamProvider>
            </Router>,
        );
        return {history, input: screen.getByRole('spinbutton')};
    }

    it('keeps new text when the URL removes the previous zero offset', () => {
        const {history, input} = setup();
        fireEvent.change(input, {target: {value: '0'}});
        expect(input).toHaveValue('0');

        act(() => {
            jest.advanceTimersByTime(600);
            fireEvent.change(input, {target: {value: '12'}});
        });

        expect(new URLSearchParams(history.location.search).get('selectedOffset')).toBeNull();
        expect(input).toHaveValue('12');
        expect(input).toHaveFocus();

        act(() => jest.advanceTimersByTime(599));
        expect(new URLSearchParams(history.location.search).get('selectedOffset')).toBeNull();
        act(() => jest.advanceTimersByTime(1));
        const params = new URLSearchParams(history.location.search);
        expect(params.get('selectedOffset')).toBe('12');
        expect(params.get('database')).toBe('/local');
        expect(params.get('clusterName')).toBe('test');
        expect(params.get('backend')).toBe('proxy');
        expect(input).toHaveValue('12');
    });

    it('still clears a zero offset when there is no newer edit', () => {
        const {history, input} = setup();
        fireEvent.change(input, {target: {value: '0'}});
        act(() => jest.advanceTimersByTime(600));

        expect(new URLSearchParams(history.location.search).get('selectedOffset')).toBeNull();
        expect(input).toHaveValue('');
    });
});
