jest.mock('../../../store', () => ({
    backend: undefined,
    clusterName: undefined,
    environment: undefined,
}));

import {configureStore} from '@reduxjs/toolkit';

import {api} from '../api';
import {tabletApi} from '../tablet';

const mockHiveInfo = jest.fn();
const mockStop = jest.fn();
const mockResume = jest.fn();
const originalApi = Object.getOwnPropertyDescriptor(window, 'api');

function createStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefault) => getDefault().concat(api.middleware),
    });
}

let store: ReturnType<typeof createStore>;

beforeEach(() => {
    store = createStore();
    mockHiveInfo.mockReset();
    mockStop.mockReset().mockResolvedValue({});
    mockResume.mockReset().mockResolvedValue({});
    Object.defineProperty(window, 'api', {
        configurable: true,
        value: {
            tablets: {
                getTabletFromHive: mockHiveInfo,
                stopTablet: mockStop,
                resumeTablet: mockResume,
            },
        },
    });
});

afterEach(() => {
    store.dispatch(api.util.resetApiState());
    if (originalApi) {
        Object.defineProperty(window, 'api', originalApi);
    } else {
        Reflect.deleteProperty(window, 'api');
    }
});

test('AdvancedInfo caches ordinary and secure requests separately and forwards cancellation', async () => {
    mockHiveInfo
        .mockResolvedValueOnce({Id: '101', State: 'ordinary'})
        .mockResolvedValueOnce({Id: '101', State: 'secure'});
    const ordinary = {id: '101', hiveId: '55', useSecurePath: false};
    const secure = {...ordinary, useSecurePath: true};

    await store.dispatch(tabletApi.endpoints.getAdvancedTableInfo.initiate(ordinary)).unwrap();
    await store.dispatch(tabletApi.endpoints.getAdvancedTableInfo.initiate(secure)).unwrap();

    expect(mockHiveInfo).toHaveBeenCalledTimes(2);
    expect(mockHiveInfo).toHaveBeenNthCalledWith(1, ordinary, {signal: expect.any(AbortSignal)});
    expect(mockHiveInfo).toHaveBeenNthCalledWith(2, secure, {signal: expect.any(AbortSignal)});
    expect(
        tabletApi.endpoints.getAdvancedTableInfo.select(ordinary)(store.getState()).data,
    ).toEqual({
        Id: '101',
        State: 'ordinary',
    });
    expect(tabletApi.endpoints.getAdvancedTableInfo.select(secure)(store.getState()).data).toEqual({
        Id: '101',
        State: 'secure',
    });
});

test.each([false, true])(
    'forwards mode %s through stop and resume endpoints',
    async (useSecurePath) => {
        const params = {id: '101', hiveId: '55', useSecurePath};
        await store.dispatch(tabletApi.endpoints.stopTablet.initiate(params)).unwrap();
        await store.dispatch(tabletApi.endpoints.resumeTablet.initiate(params)).unwrap();
        expect(mockStop).toHaveBeenCalledWith('101', '55', useSecurePath);
        expect(mockResume).toHaveBeenCalledWith('101', '55', useSecurePath);
    },
);
