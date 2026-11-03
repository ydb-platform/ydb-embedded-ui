import {uiFactory} from '../uiFactory/uiFactory';
import type {DatacenterColorIndexes} from '../utils/datacenters';

export interface DatacenterQueryContext {
    generation: number;
    configuredIndexes?: DatacenterColorIndexes;
}

/** Request metadata only: registration is handled by the fulfilled action. */
export function getDatacenterQueryContext(getState: () => unknown): DatacenterQueryContext {
    const {generation} = (getState() as {datacenters: {generation: number}}).datacenters;
    return {
        generation,
        configuredIndexes: uiFactory.datacenterColorIndexes,
    };
}
