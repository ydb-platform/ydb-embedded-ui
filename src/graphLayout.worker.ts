import {prepareTreeLayout} from './components/Graph/treeLayout';
import type {TreeLayoutRequest, TreeLayoutWorkerResponse} from './components/Graph/types';

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
