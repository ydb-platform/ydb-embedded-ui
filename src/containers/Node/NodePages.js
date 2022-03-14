import routes, {createHref} from '../../routes';

export const STORAGE = 'storage';
export const TABLETS = 'tablets';
export const OVERVIEW = 'overview';

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
        id: TABLETS,
        name: 'Tablets',
    },
];

export function getDefaultNodePath(nodeId) {
    return createHref(routes.node, {
        id: nodeId,
        activeTab: OVERVIEW,
    });
}
