import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {configureStore} from '@reduxjs/toolkit';
import {act, render} from '@testing-library/react';
import {Provider} from 'react-redux';

import queryReducer, {
    changeUserInput,
    setResultTab,
} from '../../../../../store/reducers/query/query';
import type {QueryResult} from '../../../../../store/reducers/query/types';
import {QueryResultViewer} from '../QueryResultViewer';

jest.mock('../../../../../utils/hooks', () => ({
    useTypedSelector: jest.requireActual('react-redux').useSelector,
    useTypedDispatch: jest.requireActual('react-redux').useDispatch,
}));
jest.mock('../../../../../components/Fullscreen/Fullscreen', () => ({
    Fullscreen: ({children}: React.PropsWithChildren) => children,
}));
jest.mock('../../../../../components/EnableFullscreenButton/EnableFullscreenButton', () => ({
    EnableFullscreenButton: () => null,
}));
jest.mock('../../QuerySettingsBanner/QuerySettingsBanner', () => ({
    QuerySettingsBanner: () => null,
}));
jest.mock('../components/ResultSetsViewer/ResultSetsViewer', () => ({
    ResultSetsViewer: () => null,
}));
jest.mock('../components/PlanSection/PlanSection', () => ({PlanSection: () => null}));
jest.mock('../components/TraceButton/TraceButton', () => ({TraceButton: () => null}));

test('does not rerender unchanged results when only editor input changes', () => {
    const store = configureStore({reducer: {query: queryReducer}});
    store.dispatch(setResultTab({queryType: 'execute', tabId: 'query-plan'}));
    const result: QueryResult = {
        executionId: 'run',
        queryId: 'query',
        type: 'execute',
        statisticsMode: 'basic',
        isLoading: false,
        endTime: 10,
    };
    const onRender = jest.fn();
    const Viewer = React.memo(QueryResultViewer);
    render(
        <Provider store={store}>
            <ThemeProvider theme="light">
                <React.Profiler id="result" onRender={onRender}>
                    <Viewer
                        result={result}
                        database="/local"
                        onCollapseResults={jest.fn()}
                        onExpandResults={jest.fn()}
                    />
                </React.Profiler>
            </ThemeProvider>
        </Provider>,
    );
    onRender.mockClear();
    act(() => {
        store.dispatch(changeUserInput({input: 'SELECT 2;'}));
    });
    expect(onRender).not.toHaveBeenCalled();
});
