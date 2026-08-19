import {runTreeLayout} from './runTreeLayout';
import type {TreeLayoutResult, TreeLayoutWorkerResponse} from './types';

const request = {
    nodes: [],
    links: [],
};

const result: TreeLayoutResult = {
    layout: [],
    edges: [],
};

const createWorkerMock = () => {
    const worker = {
        onerror: null,
        onmessage: null,
        postMessage: jest.fn(),
        terminate: jest.fn(),
    } as Pick<Worker, 'onerror' | 'onmessage' | 'postMessage' | 'terminate'>;

    return worker as Worker;
};

const dispatchWorkerMessage = (worker: Worker, data: TreeLayoutWorkerResponse) => {
    worker.onmessage?.(new MessageEvent('message', {data}));
};

const createScheduleMock = () => {
    let callback: (() => void) | undefined;
    const cancel = jest.fn();
    const schedule = jest.fn((nextCallback: () => void) => {
        callback = nextCallback;
        return cancel;
    });

    return {
        cancel,
        flush: () => callback?.(),
        schedule,
    };
};

describe('runTreeLayout', () => {
    test('uses the worker result when the worker succeeds', () => {
        const worker = createWorkerMock();
        const calculateLayout = jest.fn(() => result);
        const onError = jest.fn();
        const onResult = jest.fn();

        runTreeLayout({
            calculateLayout,
            createWorker: () => worker,
            onError,
            onResult,
            request,
        });
        dispatchWorkerMessage(worker, {type: 'success', result});

        expect(worker.postMessage).toHaveBeenCalledWith(request);
        expect(worker.terminate).toHaveBeenCalledTimes(1);
        expect(calculateLayout).not.toHaveBeenCalled();
        expect(onResult).toHaveBeenCalledWith(result);
        expect(onError).not.toHaveBeenCalled();
    });

    test('schedules a main-thread fallback when worker creation fails', () => {
        const workerError = new Error('Workers are blocked');
        const calculateLayout = jest.fn(() => result);
        const onResult = jest.fn();
        const {flush, schedule} = createScheduleMock();

        runTreeLayout({
            calculateLayout,
            createWorker: () => {
                throw workerError;
            },
            onError: jest.fn(),
            onResult,
            request,
            schedule,
        });

        expect(schedule).toHaveBeenCalledTimes(1);
        expect(calculateLayout).not.toHaveBeenCalled();

        flush();

        expect(calculateLayout).toHaveBeenCalledTimes(1);
        expect(onResult).toHaveBeenCalledWith(result);
    });

    test('terminates a failed worker before running the fallback', () => {
        const worker = createWorkerMock();
        const calculateLayout = jest.fn(() => result);
        const onResult = jest.fn();
        const {flush, schedule} = createScheduleMock();

        runTreeLayout({
            calculateLayout,
            createWorker: () => worker,
            onError: jest.fn(),
            onResult,
            request,
            schedule,
        });
        worker.onerror?.(new ErrorEvent('error'));

        expect(worker.terminate).toHaveBeenCalledTimes(1);
        expect(calculateLayout).not.toHaveBeenCalled();

        flush();

        expect(calculateLayout).toHaveBeenCalledTimes(1);
        expect(onResult).toHaveBeenCalledWith(result);
    });

    test('reports a worker layout error without repeating the calculation', () => {
        const worker = createWorkerMock();
        const calculateLayout = jest.fn(() => result);
        const onError = jest.fn();
        const {schedule} = createScheduleMock();

        runTreeLayout({
            calculateLayout,
            createWorker: () => worker,
            onError,
            onResult: jest.fn(),
            request,
            schedule,
        });
        dispatchWorkerMessage(worker, {type: 'error', error: 'Root node not found'});

        expect(worker.terminate).toHaveBeenCalledTimes(1);
        expect(schedule).not.toHaveBeenCalled();
        expect(calculateLayout).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith(new Error('Root node not found'));
    });

    test('cancels a scheduled fallback during cleanup', () => {
        const calculateLayout = jest.fn(() => result);
        const onResult = jest.fn();
        const {cancel, flush, schedule} = createScheduleMock();
        const cleanup = runTreeLayout({
            calculateLayout,
            createWorker: () => {
                throw new Error('Workers are blocked');
            },
            onError: jest.fn(),
            onResult,
            request,
            schedule,
        });

        cleanup();
        flush();

        expect(cancel).toHaveBeenCalledTimes(1);
        expect(calculateLayout).not.toHaveBeenCalled();
        expect(onResult).not.toHaveBeenCalled();
    });
});
