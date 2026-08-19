import {prepareTreeLayout} from './treeLayout';
import type {TreeLayoutRequest, TreeLayoutResult, TreeLayoutWorkerResponse} from './types';

type Schedule = (callback: () => void) => () => void;

interface RunTreeLayoutOptions {
    request: TreeLayoutRequest;
    createWorker: () => Worker;
    calculateLayout?: () => TreeLayoutResult;
    onResult: (result: TreeLayoutResult) => void;
    onError: (error: Error) => void;
    schedule?: Schedule;
}

const scheduleOnMainThread: Schedule = (callback) => {
    const timeoutId = globalThis.setTimeout(callback, 0);

    return () => globalThis.clearTimeout(timeoutId);
};

const normalizeError = (error: unknown) => {
    return error instanceof Error ? error : new Error(String(error));
};

export function runTreeLayout({
    request,
    createWorker,
    calculateLayout = () => prepareTreeLayout(request),
    onResult,
    onError,
    schedule = scheduleOnMainThread,
}: RunTreeLayoutOptions) {
    let worker: Worker | undefined;
    let cancelFallback: (() => void) | undefined;
    let cancelled = false;
    let settled = false;

    const terminateWorker = () => {
        worker?.terminate();
        worker = undefined;
    };

    const reportError = (error: unknown) => {
        if (cancelled || settled) {
            return;
        }

        settled = true;
        terminateWorker();
        onError(normalizeError(error));
    };

    const complete = (result: TreeLayoutResult) => {
        if (cancelled || settled) {
            return;
        }

        settled = true;
        terminateWorker();
        onResult(result);
    };

    const scheduleFallback = () => {
        if (cancelled || settled || cancelFallback) {
            return;
        }

        terminateWorker();
        cancelFallback = schedule(() => {
            cancelFallback = undefined;

            if (cancelled || settled) {
                return;
            }

            try {
                complete(calculateLayout());
            } catch (error) {
                reportError(error);
            }
        });
    };

    try {
        worker = createWorker();
        worker.onmessage = ({data}: MessageEvent<TreeLayoutWorkerResponse>) => {
            if (data.type === 'success') {
                complete(data.result);
            } else {
                reportError(new Error(data.error));
            }
        };
        worker.onerror = scheduleFallback;
        worker.onmessageerror = scheduleFallback;
        worker.postMessage(request);
    } catch {
        scheduleFallback();
    }

    return () => {
        cancelled = true;
        cancelFallback?.();
        terminateWorker();
    };
}
