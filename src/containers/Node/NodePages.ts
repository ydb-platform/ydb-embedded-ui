import {StringParam} from 'use-query-params';

import type {QueryParamsTypeFromQueryObject} from '../../routes';
import routes, {createHref} from '../../routes';

export const STORAGE = 'storage';
export const TABLETS = 'tablets';
export const OVERVIEW = 'overview';
export const STRUCTURE = 'structure';

export type NodeTab = typeof OVERVIEW | typeof STORAGE | typeof STRUCTURE | typeof TABLETS;

export const NODE_PAGES = [
    {
        id: OVERVIEW,
        name: 'Overview',
    },
    {
        id: STORAGE,
        name: 'Storage',
    },
    {
        id: STRUCTURE,
        name: 'Structure',
    },
    {
        id: TABLETS,
        name: 'Tablets',
    },
];

export const nodePageQueryParams = {
    database: StringParam,
};

type NodePageQuery = QueryParamsTypeFromQueryObject<typeof nodePageQueryParams>;

export function getDefaultNodePath(
    nodeId: string | number,
    query: NodePageQuery = {},
    activeTab: NodeTab = OVERVIEW,
) {
    return createHref(
        routes.node,
        {
            id: nodeId,
            activeTab,
        },
        query,
    );
}
