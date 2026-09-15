import {backend, clusterName, environment} from '../../../store';

/** Grouped tables share a width; pagination and sorting do not change the selection. */
export function getStorageNodesSelectionKey<T extends object>(
    filters: T | undefined,
    type: string,
    storage: boolean | undefined,
) {
    return JSON.stringify([
        backend,
        clusterName,
        environment,
        type,
        storage,
        Object.entries(filters ?? {})
            .filter(([key]) => key !== 'filterGroup')
            .sort(([left], [right]) => left.localeCompare(right)),
    ]);
}
