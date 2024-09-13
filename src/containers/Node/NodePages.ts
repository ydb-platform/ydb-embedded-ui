import type {Query} from '../../routes';
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
    // TODO: remove Node Structure component
    // {
    //     id: STRUCTURE,
    //     name: 'Structure',
    // },
    {
        id: TABLETS,
        name: 'Tablets',
    },
];

export function getDefaultNodePath(
    nodeId: string | number,
    query: Query = {},
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
