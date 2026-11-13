import type {getUrlData} from './getUrlData';

export let backend: string | undefined,
    basename: string,
    clusterName: string | undefined,
    environment: string | undefined;

export function setRuntimeParams(params: ReturnType<typeof getUrlData>) {
    ({basename, clusterName, environment, backend} = params);
}
