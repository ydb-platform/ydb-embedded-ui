import Icon from '../../components/Icon/Icon';

export const HEALTHCHECK = 'healthcheck';
export const STORAGE = 'storage';
export const COMPUTE = 'compute';
export const SCHEMA = 'schema';
export const NETWORK = 'network';

export const TENANT_PAGES = [
    {
        id: SCHEMA,
        name: 'Schema',
        icon: <Icon name="schema" viewBox="0 0 576 512" />,
    },
    {
        id: STORAGE,
        name: 'Storage',
        icon: <Icon name="storage" viewBox="0 0 448 512" />,
    },
    {
        id: COMPUTE,
        name: 'Compute',
        icon: <Icon name="compute" viewBox="0 0 384 512" />,
    },
    {
        id: NETWORK,
        name: 'Network',
        icon: <Icon name="network" viewBox="0 0 640 512" />,
    },
    {
        id: HEALTHCHECK,
        name: 'Healthcheck',
        icon: <Icon name="healthcheck" viewBox="0 0 512 512" />,
    },
];
