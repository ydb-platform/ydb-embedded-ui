import {prepareTreeLayout} from './treeLayout';
import type {TreeLayoutRequest, TreeLayoutWorkerResponse} from './types';

const workerScope = globalThis as unknown as {
    onmessage: ((event: MessageEvent<TreeLayoutRequest>) => void) | null;
    postMessage: (response: TreeLayoutWorkerResponse) => void;
};

workerScope.onmessage = ({data}) => {
    try {
        workerScope.postMessage({
            type: 'success',
            result: prepareTreeLayout(data),
        });
    } catch (error) {
        workerScope.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
