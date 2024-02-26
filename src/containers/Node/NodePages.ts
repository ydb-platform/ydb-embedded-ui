import routes, {Query, createHref} from '../../routes';

export const STORAGE = 'storage';
export const TABLETS = 'tablets';
export const OVERVIEW = 'overview';
export const STRUCTURE = 'structure';

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

export function getDefaultNodePath(nodeId: string | number, query: Query = {}) {
    return createHref(
        routes.node,
        {
            id: nodeId,
            activeTab: OVERVIEW,
        },
        query,
    );
}
