import {configureStore} from '@reduxjs/toolkit';
import {waitFor} from '@testing-library/react';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import type {StreamDataChunk} from '../../../../types/store/streaming';
import {api} from '../../api';
import {queryApi} from '../api';
import queryReducer from '../query';
import type {QueryState} from '../types';

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
}

interface StreamingCallbacks {
    onStreamDataChunk: (chunk: StreamDataChunk) => void;
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });

    return {promise, resolve, reject};
}

function createQueryState(): QueryState {
    return {
        activeTabId: 'tab-1',
        tabsOrder: ['tab-1'],
        tabsById: {
            'tab-1': {
                id: 'tab-1',
                title: '',
                input: '',
                isDirty: false,
                createdAt: 0,
                updatedAt: 0,
            },
        },
        newTabCounter: 0,
    };
}

function createTestStore() {
    return configureStore({
        reducer: {
            query: queryReducer,
            [api.reducerPath]: api.reducer,
        },
        preloadedState: {query: createQueryState()},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({serializableCheck: false}).concat(api.middleware),
    });
}

function sendQueryParams(queryId: string) {
    return {
        tabId: 'tab-1',
        actionType: 'execute' as const,
        startTime: 1_000,
        query: `SELECT '${queryId}';`,
        database: '/local',
        queryId,
        historyQueryId: `history-${queryId}`,
    };
}

describe('query execution identity', () => {
    const originalApi = window.api;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    afterEach(() => {
        window.api = originalApi;
        Object.defineProperty(window, 'requestAnimationFrame', {
            configurable: true,
            value: originalRequestAnimationFrame,
        });
        Object.defineProperty(window, 'cancelAnimationFrame', {
            configurable: true,
            value: originalCancelAnimationFrame,
        });
    });

    test('late non-streaming completion should not replace a newer result', async () => {
        const firstResponse = createDeferred<unknown>();
        const secondResponse = createDeferred<unknown>();
        const sendQuery = jest
            .fn()
            .mockImplementationOnce(() => firstResponse.promise)
            .mockImplementationOnce(() => secondResponse.promise);
        window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const firstQuery = store.dispatch(
            queryApi.endpoints.useSendQuery.initiate(sendQueryParams('query-a')),
        );
        await waitFor(() => expect(sendQuery).toHaveBeenCalledTimes(1));
        const secondQuery = store.dispatch(
            queryApi.endpoints.useSendQuery.initiate(sendQueryParams('query-b')),
        );
        await waitFor(() => expect(sendQuery).toHaveBeenCalledTimes(2));
        const secondExecutionId = store.getState().query.tabsById['tab-1'].result?.executionId;

        firstResponse.resolve({
            result: [{columns: [{name: 'value', type: 'Utf8'}], rows: [['stale-value']]}],
        });
        await firstQuery;

        expect(store.getState().query.tabsById['tab-1'].result).toMatchObject({
            executionId: secondExecutionId,
            queryId: 'query-b',
            isLoading: true,
        });
        expect(store.getState().query.tabsById['tab-1'].result?.data).toBeUndefined();

        secondResponse.resolve({
            result: [{columns: [{name: 'value', type: 'Utf8'}], rows: [['current-value']]}],
        });
        await secondQuery;
    });

    test('late non-streaming error should not fail a newer result', async () => {
        const firstResponse = createDeferred<unknown>();
        const secondResponse = createDeferred<unknown>();
        const sendQuery = jest
            .fn()
            .mockImplementationOnce(() => firstResponse.promise)
            .mockImplementationOnce(() => secondResponse.promise);
        window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const firstQuery = store.dispatch(
            queryApi.endpoints.useSendQuery.initiate(sendQueryParams('query-a')),
        );
        await waitFor(() => expect(sendQuery).toHaveBeenCalledTimes(1));
        const secondQuery = store.dispatch(
            queryApi.endpoints.useSendQuery.initiate(sendQueryParams('query-b')),
        );
        await waitFor(() => expect(sendQuery).toHaveBeenCalledTimes(2));
        const secondExecutionId = store.getState().query.tabsById['tab-1'].result?.executionId;

        firstResponse.reject(new Error('stale failure'));
        await firstQuery;

        expect(store.getState().query.tabsById['tab-1'].result).toMatchObject({
            executionId: secondExecutionId,
            queryId: 'query-b',
            isLoading: true,
        });
        expect(store.getState().query.tabsById['tab-1'].result?.error).toBeUndefined();

        secondResponse.resolve({
            result: [{columns: [{name: 'value', type: 'Utf8'}], rows: [['current-value']]}],
        });
        await secondQuery;
    });

    test('backend cancellation should return stopped query stats', async () => {
        const sendQuery = jest.fn().mockResolvedValue({
            error: {severity: 1, message: 'Query was cancelled'},
            issues: [{severity: 1, message: 'Query was cancelled'}],
            status: 'CANCELLED',
        });
        window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const result = await store.dispatch(
            queryApi.endpoints.useSendQuery.initiate(sendQueryParams('query-a')),
        );

        expect(
            (result as {error?: {extra?: {queryStats?: {status?: string}}}}).error?.extra
                ?.queryStats?.status,
        ).toBe('stopped');
    });

    test('aborted request should return stopped query stats', async () => {
        const sendQuery = jest.fn().mockRejectedValue({name: 'AbortError'});
        window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
        const store = createTestStore();

        const result = await store.dispatch(
            queryApi.endpoints.useSendQuery.initiate(sendQueryParams('query-a')),
        );

        expect(
            (result as {error?: {extra?: {queryStats?: {status?: string}}}}).error?.extra
                ?.queryStats?.status,
        ).toBe('stopped');
    });

    test('aborted streaming query should discard its pending animation-frame batch', async () => {
        const firstResponse = createDeferred<void>();
        const secondResponse = createDeferred<void>();
        let firstCallbacks: StreamingCallbacks | undefined;
        const streamQuery = jest
            .fn()
            .mockImplementationOnce((_params, callbacks: StreamingCallbacks) => {
                firstCallbacks = callbacks;
                return firstResponse.promise;
            })
            .mockImplementationOnce(() => secondResponse.promise);
        window.api = {streaming: {streamQuery}} as unknown as YdbEmbeddedAPI;
        let nextAnimationFrameId = 40;
        const requestAnimationFrame = jest.fn((_callback: FrameRequestCallback): number => {
            nextAnimationFrameId += 1;
            return nextAnimationFrameId;
        });
        const cancelAnimationFrame = jest.fn();
        Object.defineProperty(window, 'requestAnimationFrame', {
            configurable: true,
            value: requestAnimationFrame,
        });
        Object.defineProperty(window, 'cancelAnimationFrame', {
            configurable: true,
            value: cancelAnimationFrame,
        });
        const store = createTestStore();

        const firstQuery = store.dispatch(
            queryApi.endpoints.useStreamQuery.initiate({
                tabId: 'tab-1',
                startTime: 1_000,
                query: 'SELECT 1;',
                database: '/local',
                historyQueryId: 'history-a',
            }),
        );
        await waitFor(() => expect(streamQuery).toHaveBeenCalledTimes(1));
        const animationFrameCountBeforeData = requestAnimationFrame.mock.calls.length;
        firstCallbacks?.onStreamDataChunk({
            meta: {event: 'StreamData', seq_no: 0, result_index: 0},
            result: {
                columns: [{name: 'value', type: 'Uint64'}],
                rows: [['stale-value']],
            },
        });
        expect(requestAnimationFrame).toHaveBeenCalledTimes(animationFrameCountBeforeData + 1);
        const scheduledBatchCallback = requestAnimationFrame.mock.calls.at(-1)?.[0];
        const scheduledBatchId = nextAnimationFrameId;

        const secondQuery = store.dispatch(
            queryApi.endpoints.useStreamQuery.initiate({
                tabId: 'tab-1',
                startTime: 1_000,
                query: 'SELECT 2;',
                database: '/local',
                historyQueryId: 'history-b',
            }),
        );
        await waitFor(() => expect(streamQuery).toHaveBeenCalledTimes(2));
        const secondExecutionId = store.getState().query.tabsById['tab-1'].result?.executionId;

        firstResponse.reject({name: 'AbortError'});
        await firstQuery;
        expect(cancelAnimationFrame).toHaveBeenCalledWith(scheduledBatchId);

        scheduledBatchCallback?.(0);
        expect(store.getState().query.tabsById['tab-1'].result).toMatchObject({
            executionId: secondExecutionId,
            isLoading: true,
        });
        expect(store.getState().query.tabsById['tab-1'].result?.data).toBeUndefined();

        secondResponse.reject({name: 'AbortError'});
        await secondQuery;
    });
});
