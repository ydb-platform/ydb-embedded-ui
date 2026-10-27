import {uiFactory} from '../uiFactory/uiFactory';
import type {DatacenterColorIndexes} from '../utils/datacenters';

import type {QueryScope} from './queryScope';
import {getQueryScope} from './queryScope';

export interface DatacenterQueryContext {
    scope: QueryScope;
    generation: number;
    configuredIndexes?: DatacenterColorIndexes;
}

/** Request metadata only: registration is handled by the fulfilled action. */
export function getDatacenterQueryContext(
    getState: () => unknown,
    scope?: QueryScope,
): DatacenterQueryContext {
    const {generation} = (getState() as {datacenters: {generation: number}}).datacenters;
    return {
        scope: getQueryScope(scope),
        generation,
        configuredIndexes: uiFactory.datacenterColorIndexes,
    };
}
