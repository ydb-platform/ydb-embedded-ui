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

    it.each([false, true])(
        'handles normalized zero without losing newer text (new edit: %s)',
        (newEdit) => {
            const {history, input} = setup();
            fireEvent.change(input, {target: {value: '0'}});
            act(() => {
                jest.advanceTimersByTime(600);
                if (newEdit) {
                    fireEvent.change(input, {target: {value: '12'}});
                }
            });
            expect(new URLSearchParams(history.location.search).get('selectedOffset')).toBeNull();
            expect(input).toHaveValue(newEdit ? '12' : '');
            act(() => jest.advanceTimersByTime(599));
            expect(new URLSearchParams(history.location.search).get('selectedOffset')).toBeNull();
            act(() => jest.advanceTimersByTime(1));
            expect(new URLSearchParams(history.location.search).get('selectedOffset')).toBe(
                newEdit ? '12' : null,
            );
            expect(input).toHaveValue(newEdit ? '12' : '');
        },
    );
});
